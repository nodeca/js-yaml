JS-YAML - YAML 1.2 parser / writer for JavaScript
=================================================

[![CI](https://github.com/nodeca/js-yaml/actions/workflows/ci.yml/badge.svg)](https://github.com/nodeca/js-yaml/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/js-yaml.svg)](https://www.npmjs.org/package/js-yaml)

__[Online Demo](https://nodeca.github.io/js-yaml/)__


A fast and complete [YAML](https://yaml.org/) parser and writer for JavaScript.
Supports both the 1.2 and 1.1 specs, and passes the entire
[YAML Test Suite](https://github.com/yaml/yaml-test-suite).


Installation
------------

```
npm install js-yaml
```

Upgrading from v4? See the [v5 migration guide](docs/migrate_v4_to_v5.md).


API
---

Here we cover the most useful methods. If you need advanced details (such as
creating your own tags), see the [examples](examples/) for more info.

``` javascript
import { load } from 'js-yaml'
import { readFileSync } from 'node:fs'

// Get document, or throw exception on error
try {
  const doc = load(readFileSync('example.yml', 'utf8'))
  console.log(doc)
} catch (e) {
  // console.log(e)
}
```


### load (string [ , options ])

Parses `string` as a single YAML document. Throws `YAMLException` on error.
This function **does not** understand multi-document or empty sources; it throws
an exception on those.

> [!WARNING]
> When processing untrusted input, see the
> [security considerations](docs/safety.md).

options:

- `filename` _(default: null)_ - string to be used as a file path in error
  messages.
- `schema` _(default: `CORE_SCHEMA`)_ - specifies a schema to use.
  - `FAILSAFE_SCHEMA` - only strings, arrays and plain objects.
  - `JSON_SCHEMA` - all JSON-supported types.
  - `CORE_SCHEMA` - a superset of `JSON_SCHEMA`, accepting more notations for
    the same types.
  - `YAML11_SCHEMA` - adds the legacy YAML 1.1 types (`!!binary`, `!!timestamp`,
    `!!omap`, `!!pairs`, `!!set`, merge keys `<<`, and the broader 1.1 scalar
    notations).
- `json` _(default: false)_ - compatibility with `JSON.parse` behaviour. If
  `true`, duplicate keys in a mapping override values rather than throwing an
  error.
- `maxDepth` _(default: 100)_ - limits the nesting depth for collections (does
  not take aliases into account).
- `maxTotalMergeKeys` _(default: 10000)_ - limits the total number of keys
  processed by merge (`<<`) across one `load()` / `loadAll()` call. Set to `-1`
  to disable.
- `maxAliases` _(default: -1)_ - limits the number of alias nodes (`*ref`) per
  document. Set to `0` to reject all aliases, or to `-1` for no limit.

> [!NOTE]
>
> The default `CORE_SCHEMA` comes without the `!!merge` tag. You can easily
> enable it if needed:
>
> ``` javascript
> import { load, CORE_SCHEMA, mergeTag } from 'js-yaml'
>
> load(data, { schema: CORE_SCHEMA.withTags(mergeTag) })
> ```

> [!WARNING]
>
> The default `mapTag` is `{}`-object based and does not allow complex keys
> (objects, arrays and so on). That's an intentional choice for convenience.
> Also, non-string scalar keys, such as `null`, numbers or booleans, are
> converted to strings.
>
> In the rare cases where you really need complex keys, use `realMapTag` in the
> schema instead. It stores any key exactly as provided, at the cost of less
> convenient access.

See [examples](examples/) for advanced customization approaches.


### loadAll (string [, options ])

Same as `load()`, but understands multi-document sources. Returns an array of
documents.

``` javascript
import { loadAll } from 'js-yaml'

console.log(loadAll(data))
```


### dump (object [ , options ])

Serializes `object` as a YAML document. By default it can dump every supported
YAML type, so it throws an exception if you try to dump regexps or functions.
However, you can disable exceptions by setting the `skipInvalid` option to
`true`.

options:

- `indent` _(default: 2)_ - indentation width to use (in spaces).
- `flowLevel` _(default: -1)_ - nesting level at which collections switch from
  block to flow style (`-1` means never).
- `seqNoIndent` _(default: false)_ - when `true`, does not add an indentation
  level to array elements, `␣␣- 1` => `- 1`.
- `seqInlineFirst` _(default: true)_ - when `true`, allows a nested collection
  to start on the same line after `-`, `-\n  - 1` => `- - 1`.
- `skipInvalid` _(default: false)_ - do not throw on invalid types (such as a
  function in the schema). Invalid mapping pairs and sequence items are skipped;
  `undefined` sequence items are serialized as `null`.
- `schema` _(default: a `YAML11_SCHEMA`-based schema)_ - specifies a schema to
  use.
- `sortKeys` _(default: `false`)_ - if `true`, sort keys when dumping YAML. If a
  function, use the function to sort the keys.
- `lineWidth` _(default: `80`)_ - sets the max line width. Set `-1` for unlimited
  width.
- `noRefs` _(default: `false`)_ - if `true`, don't convert duplicate objects into
  references; inline them instead.
- `quoteStyle` _(`single` or `double`, default: `single`)_ - quoting style to use
  when a string needs quotes.
- `forceQuotes` _(default: `false`)_ - if `true`, quote all non-key strings,
  using `quoteStyle`.
- `flowBracketPadding` _(default: `false`)_ - add spaces inside flow collection
  brackets, `{a: 1}` => `{ a: 1 }`.
- `flowSkipCommaSpace` _(default: `false`)_ - omit the space after commas in
  flow collections, `[1, 2]` => `[1,2]`.
- `flowSkipColonSpace` _(default: `false`)_ - omit the space after `:` in flow
  mappings, `{a: 1}` => `{a:1}`.
- `quoteFlowKeys` _(default: `false`)_ - quote flow mapping keys, `{a: 1}` =>
  `{"a": 1}`.
- `tagBeforeAnchor` _(default: `false`)_ - print an explicit tag before an
  anchor, `&ref_0 !!set` => `!!set &ref_0`.
- `transform` - a function `(documents: Document[]) => void` that can mutate the
  generated AST before it is rendered.

See [examples](examples/) for advanced customization approaches.


Supported YAML types
--------------------

The list of standard YAML tags and corresponding JavaScript types. See also
[YAML tag discussion](https://pyyaml.org/wiki/YAMLTagDiscussion) and
[YAML types repository](https://yaml.org/type/).

```
!!null ''                   # null
!!bool 'true'               # bool
!!int '3...'                # number
!!float '3.14...'           # number
!!str '...'                 # string
!!seq [ ... ]               # array
!!map { ... }               # object (or Map)
```

The types below are only available in `YAML11_SCHEMA` (not in the default
`CORE_SCHEMA`):

```
!!binary '...base64...'     # Uint8Array
!!timestamp 'YYYY-...'      # date
!!set { ... }               # Set

# Legacy YAML 1.1 compatibility only; these types cannot be dumped.
!!omap [ ... ]              # array of key-value pairs
!!pairs [ ... ]             # array of array pairs
```

To preserve complex keys in the first position of a `!!pairs` item, replace
the default object-based map with `realMapTag` in the schema.

**JavaScript-specific tags**

See [js-yaml-js-types](https://github.com/nodeca/js-yaml-js-types) for
extra types.


CLI
---

This can be useful sometimes for a quick check.

```
npx js-yaml -h
```

Note: the CLI script comes with minimal options, and there are no big plans to
extend it.
