# Migration guide from `js-yaml@3` to `js-yaml@4`.

### safeLoad(), safeLoadAll(), safeDump() => load(), loadAll(), dump()

Older `safe*` functions were renamed.

js-yaml v3:

```js
yaml.safeLoad(str)
yaml.safeLoadAll(str)
yaml.safeDump(obj)
```

js-yaml v4:

```js
yaml.load(str)
yaml.loadAll(str)
yaml.dump(obj)
```


### Old load(), loadAll(), dump() were replaced by safe methods

`!!js/function`, `!!js/regexp`, `!!js/undefined` type definitions are moved to external package [js-yaml-js-types](https://github.com/nodeca/js-yaml-js-types). To restore previous (unsafe) behaviour, use a custom extended schema.

js-yaml v3:

```js
yaml.load(str)
yaml.loadAll(str)
yaml.dump(obj)
```

js-yaml v4:

```js
let schema = yaml.DEFAULT_SCHEMA.extend(require('js-yaml-js-types').all)

yaml.load(str, { schema })
yaml.loadAll(str, { schema })
yaml.dump(obj, { schema })
```


### `Schema.create`, `DEFAULT_SAFE_SCHEMA` and `DEFAULT_FULL_SCHEMA` are removed


js-yaml v3:

```js
let schema1 = yaml.DEFAULT_SAFE_SCHEMA
let schema2 = yaml.DEFAULT_FULL_SCHEMA
let schema3 = yaml.Schema.create(yaml.DEFAULT_SAFE_SCHEMA, [ customTags ])
```

js-yaml v4:

```js
let schema1 = yaml.DEFAULT_SCHEMA
let schema2 = yaml.DEFAULT_SCHEMA.extend(require('js-yaml-js-types').all)
let schema3 = yaml.DEFAULT_SCHEMA.extend([ customTags ])
```


### Loading in v4 documents previously dumped in v3

js-yaml v3 may dump some strings starting with 0 without quotes. They will load as numbers in v4.

Affected data (if you have these **unquoted strings**, they may get converted to numbers):

 - integers starting with `0` that contain `8` or `9` digits
   - `"0128"` dumped by v3 as `0128` then parsed by v4 into number `128`
   - `"0127"` is not affected, because it's dumped by v3 as `"0127"` (it looks like old-style octal, so v3 quotes it)
 - floats starting with `0` (except for `0.`)
   - `"012.34"` dumped by v3 as `012.34` then parsed by v4 into number `12.34`
   - `"012e+4"` dumped by v3 as `012e+4` then parsed by v4 into number `120000`
   - `"0.0123"` is not affected (it looks like a normal float, so v3 quotes it)

This is what happens:

```js
let data = '0123456789'
// typeof data === 'string'

str  = require('js-yaml@3').dump('0123456789')
data = require('js-yaml@4').load(str)

// data will be 123456789
// typeof data === 'number'
```

You can check for these patterns in your data using regexp like this:

```yaml
grep '\(^\|:\s\s*\)0[0-9][.0-9]*\s*$' *.yml
```

If you have these in your yaml files anywhere, you should quote them (e.g. `0123456789` => `"0123456789"`).


### Reduced nesting in `/lib` folder

If you reference anything inside js-yaml/lib folder, i.e. `require('js-yaml/lib/XXX')`, you'll need to change paths.

js-yaml v3:

```js
require('js-yaml/lib/js-yaml/common');
require('js-yaml/lib/js-yaml/type/int');
```

js-yaml v4:

```js
require('js-yaml/lib/common');
require('js-yaml/lib/type/int');
```
