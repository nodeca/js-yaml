# Migration guide from `js-yaml@4` to `js-yaml@5` <!-- omit in toc -->

- [Base](#base)
- [`load` / `loadAll`](#load--loadall)
  - [Removed options](#removed-options)
  - [Empty input throws](#empty-input-throws)
  - [Schema](#schema)
  - [Mapping keys](#mapping-keys)
  - [`!!set`](#set)
- [`dump`](#dump)
  - [Removed options](#removed-options-1)
  - [Replacing `styles`](#replacing-styles)
- [Custom types](#custom-types)

js-yaml v5 has a new API and a new YAML implementation. `load()` and `dump()`
stay, but exports, schemas, options and custom tags changed. Work through the
sections in order and skip the ones you don't use.

## Base

If you only `load()` and `dump()` without options, this is the whole migration:
swap the import and you're done.

```js
// v4
const yaml = require('js-yaml')
yaml.load(source)
yaml.dump(data)

// v5
import { load, dump } from 'js-yaml'
load(source)
dump(data)
```

CommonJS keeps working through destructuring:

```js
const { load, dump } = require('js-yaml')
```

If you want to keep the old namespace-style calls, import the ESM namespace
instead:

```js
import * as yaml from 'js-yaml'

yaml.load(source)
yaml.dump(data)
```

js-yaml v5 does not provide an ESM default export by design. Prefer named
exports for new code, or use the namespace import above when migrating code that
expects `yaml.load()` / `yaml.dump()`.

Exports are now flat. The `types` namespace, the `Type` class and
`DEFAULT_SCHEMA` are gone, and internal `js-yaml/lib/...` imports no longer
resolve. If you used any of those, read on.

## `load` / `loadAll`

### Removed options

| Removed option        | What to do                                  |
| --------------------- | ------------------------------------------- |
| `onWarning`, `legacy` | nothing — errors are still thrown           |
| `listener`            | was a workaround for the missing AST; v5 exposes events and an AST to build your own pipeline |

### Empty input throws

`load('')` now throws: an empty stream has no document, and `load` has no output
value to signal its absence. Previously it cheated on types and returned
`undefined`; now it just throws an error.

`loadAll('')` is unchanged — it still returns an empty array of documents.

### Schema

`load()` now uses the YAML 1.2 `CORE_SCHEMA`, as recommended by the spec author.
In practice the most common compatibility difference is the missing `!!merge`
(`<<`) feature, which is easy to add back:

```js
import { load, CORE_SCHEMA, mergeTag } from 'js-yaml'

load(source, { schema: CORE_SCHEMA.withTags(mergeTag) })
```

If you need the legacy YAML 1.1 types (`!!timestamp`, `!!binary`, `!!set`) or
its slightly different int/float/boolean syntax, pass `YAML11_SCHEMA`:

```js
import { load, YAML11_SCHEMA } from 'js-yaml'

load(source, { schema: YAML11_SCHEMA })
```

To register custom tags on a schema, `Schema.extend()` is now
`Schema.withTags()`.


### Mapping keys

Simple keys (numbers, strings) are still stringified, but complex keys (arrays,
objects) now throw instead of being silently coerced to a lossy string.

You can restore the old behavior, though it's not recommended:

```js
import { load, CORE_SCHEMA, legacyMapTag } from 'js-yaml'

load(source, { schema: CORE_SCHEMA.withTags(legacyMapTag) })
```

Alternatively, get real `Map` instances with no key restrictions — then it's
your job to handle them:

```js
import { load, CORE_SCHEMA, realMapTag } from 'js-yaml'

load(source, { schema: CORE_SCHEMA.withTags(realMapTag) })
```

### `!!set`

The YAML 1.1 `!!set` tag now produces a `Set` instead of an object of `null`s:

```js
load('!!set { one, two }', { schema: YAML11_SCHEMA })
// Set { 'one', 'two' }
```

## `dump`

By default dump now uses `YAML11_SCHEMA`, slightly extended with YAML 1.2
`0o...` ints and exponent-only floats. This guarantees safe quoting for all YAML
versions. If you don't need deep compatibility, you can pass `CORE_SCHEMA` to
options.

### Removed options

| Removed option               | What to do                                                  |
| ---------------------------- | ----------------------------------------------------------- |
| `styles`                     | override the tag's `represent()` (see below)                |
| `replacer`                   | removed — patch the data before `dump()`                    |
| `noCompatMode`               | select the schema whose scalar rules apply                  |
| `condenseFlow`               | `flowSkipCommaSpace`, `flowSkipColonSpace`, `quoteFlowKeys` |
| `quotingType`                | `quoteStyle: 'single'` or `quoteStyle: 'double'`            |
| `noArrayIndent`              | `seqNoIndent`                                               |

### Replacing `styles`

Patch the tag whose output you want to change:

```js
import { CORE_SCHEMA, dump, nullCoreTag } from 'js-yaml'

const schema = CORE_SCHEMA.withTags({ ...nullCoreTag, represent: () => '~' })

dump({ value: null }, { schema })
```

If you style int/float and want to keep quoting safe, patch `resolve` too, as the
default dump schema does:

```js
import { YAML11_SCHEMA, dump, NOT_RESOLVED, intYaml11Tag, intCoreTag } from 'js-yaml'

const schema = YAML11_SCHEMA.withTags({
  ...intYaml11Tag,
  represent: (value) => value >= 0 ? `0x${value.toString(16)}` : value.toString(10),
  resolve: (source, isExplicit) => {
    const result = intYaml11Tag.resolve(source, isExplicit)
    return result === NOT_RESOLVED ? intCoreTag.resolve(source, isExplicit) : result
  }
})
```

## Custom types

The `Type` class is gone. Tags are now built with `defineScalarTag`,
`defineSequenceTag` or `defineMappingTag` (pick by node kind); one tag describes
both loading and dumping, and you register it via `schema.withTags(...)`.

The model is different, not just renamed: instead of one `construct(data)`, the
collection tags build incrementally (`create` + `addItem` / `addPair`), scalars
return the value or `NOT_RESOLVED`, and `instanceOf` becomes `identify`.
`identify` is required because it explicitly controls whether the tag may be
selected when dumping. For a load-only tag, use `identify: () => false`.

```js
// v4
const pointType = new yaml.Type('!point', {
  kind: 'sequence',
  construct: data => new Point(...data),
  instanceOf: Point,
  represent: point => [point.x, point.y]
})

// v5
import { defineSequenceTag } from 'js-yaml'

const pointTag = defineSequenceTag('!point', {
  create: () => new Point(),
  addItem: (point, value, index) => {
    if (index === 0) point.x = value
    if (index === 1) point.y = value
  },
  identify: value => value instanceof Point,
  represent: point => [point.x, point.y]
})
```

If the result cannot be populated incrementally, collect its contents in a
temporary carrier and add `finalize`:

```js
const pointTag = defineSequenceTag('!point', {
  create: () => [],
  addItem: (items, value) => { items.push(value) },
  finalize: items => new ImmutablePoint(...items),
  identify: value => value instanceof ImmutablePoint,
  represent: point => [point.x, point.y]
})
```

An anchored tag with a temporary carrier cannot recursively alias itself,
because its result does not exist until `finalize` returns. Such input throws.

This only sketches the shape. See
[examples/custom_tags.mjs](../examples/custom_tags.mjs) for the full method set
and [examples/custom_tags_immutable.mjs](../examples/custom_tags_immutable.mjs)
for carrier finalization and its recursive-alias limitation.
