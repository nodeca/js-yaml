JS-YAML - YAML 1.2 parser for JavaScript
========================================

[![Build Status](https://secure.travis-ci.org/nodeca/js-yaml.png)](http://travis-ci.org/nodeca/js-yaml)

[Online Demo](http://nodeca.github.com/js-yaml/)


This is an implementation of [YAML](http://yaml.org/), a human friendly data
serialization language.

Previously, it was a native port of [PyYAML](http://pyyaml.org/). Now, it is
rewritten from scratch, directly from version 1.2 of the specification.


## Breaking changes in 1.x.x -> 2.0.x

- The last argument of loader functions (`load`, `loadAll`, 'safeLoad`, and
  `safeLoadAll`) was changed. Now, it is an optional `settings` plain object.
  See the API listing on `load` function for details.
- `scan`, `parse`, `compose`, `addConstructor` functions and all of the classes
  like `Loader`, `Constructor`, `Resolver` was dropped because of complete
  architecture overhaul.
- The parsing process consists of only one stage now. The loader constructs the
  resulting strings, arrays, and objects (mappings) without any interim
  representation objects. So, tag interpreters receive native JavaScript objects
  directly.


### How to migrate

If your code does not use neither custom tags nor explicitly specified Loader
class (the last argument of `load` function), you are not required to change
anything.

Otherwise, you should rewrite your tag constructors and custom Loader classes to
conform the new schema-based API. It consists of two classes: Schema and Type.
The both are described below in the API listing. Here is an example of the
difference:

JS-YAML 1.x.x
``` javascript
var yaml = require('js-yaml');

yaml.addConstructor('!cookies', function (node) {
  var array, index, length;

  array = this.constructSequence(node);

  for (index = 0, length = array.length; index < length; index += 1) {
    array[index] = 'A ' + array[index] + ' with some cookies!';
  }

  return array;
});

result = yaml.load(data);
```

JS-YAML 2.0.x
``` javascript
var yaml = require('js-yaml');

var cookiesType = new yaml.Type('!cookies', function (array, explicit) {
  var index, length;

  if (!Array.isArray(array)) {
    return yaml.NIL;
  }

  for (index = 0, length = array.length; index < length; index += 1) {
    array[index] = 'A ' + array[index] + ' with some cookies!';
  }

  return array;
});

var COOKIES_SCHEMA = new yaml.Schema({
  include:  [ yaml.DEFAULT_SCHEMA ],
  explicit: [ cookiesType ]
});

result = yaml.load(data, { schema: COOKIES_SCHEMA });
```


## Breaking changes in 0.3.x -> 1.0.x

- `y`, `yes`, `n`, `no`, `on`, `off` are not converted to Booleans anymore.
  Decision to drop support of such "magic" was made after speaking with YAML
  core developers: from now on we try to keep as minimal subset of rules as
  possible to keep things obvious. Booleans are following YAML 1.2 core schema
  now: http://www.yaml.org/spec/1.2/spec.html#id2804923
- `require('file.yml')` now returns a single document (was array of documents)
  and throws an error when file contains multiple documents. That should improve
  switching between YAML <-> JSON. So `require('file.yml')` will give the same
  result as if it was `require('file.json')` now.
- CLI tool `js-yaml` become part of `js-yaml` again.


## Installation

### YAML module for node.js

```
npm install js-yaml
```


### CLI executable

If you want to inspect your YAML files from CLI, install js-yaml globally:

```
npm install js-yaml -g
```

##### Usage

    usage: js-yaml [-h] [-v] [-c] [-j] [-t] file

    Positional arguments:
      file           File with YAML document(s)

    Optional arguments:
      -h, --help     Show this help message and exit.
      -v, --version  Show program's version number and exit.
      -c, --compact  Display errors in compact mode
      -j, --to-json  Output a non-funky boring JSON
      -t, --trace    Show stack trace on error



### Bundled YAML library for browsers

``` html
<script src="js-yaml.min.js"></script>
<script type="text/javascript">
var doc = jsyaml.load('greeting: hello\nname: world');
</script>
```

Browser support is still buggy, and mostly done to run online demo. If you
can help to improve browser compatibility and AMD support - rise pull request.

**Support of oldIEs** and some other prehistoric browsers is possible using
[es5-shims](https://github.com/kriskowal/es5-shim). Just include shims before
jsyaml to use it with outdated browsers.


## API

JS-YAML automatically registers handlers for `.yml` and `.yaml` files. You can
load them just with `require`. That's mostly equivalent to calling `load()` on
fetched content of a file. Just with one string!

``` javascript
require('js-yaml');

// Get document, or throw exception on error
var doc = require('/home/ixti/example.yml');

console.log(doc);
```


### load (string [ , settings ])

Parses `string` as single YAML document. Returns JS object or throws `YAMLError`
exception on error.

NOTE: This function does NOT understands multi-doc sources, it throws exception
on those.

`settings` is an optional hash-like object allows to change the loader's
behavoiur. It may contain the following keys:

- `schema` specifies a schema to use. It's `yaml.DEFAULT_SCHEMA` by default.
  See below for more information about the schemas.
- `validate` (default true) enables/disables validation of the input stream
  according to YAML rules. If you are sure about the input, you can set it to
  false and (maybe) gain some additional performance.
- `strict` (default false) makes the loader to throw errors instead of warnings.
- `legacy` (default false) makes the loader to expect YAML 1.1 documents if such
  documents have no explicit %YAML directive.
- `name` (default null) is a string to be used as a file path in error/warning
  messages.

``` javascript
var yaml = require('js-yaml');

// pass the string
fs.readFile('/home/ixti/example.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }
  try {
    console.log( yaml.load(data) );
  } catch(e) {
    console.log(e);
  }
});
```


### loadAll (string, iterator [ , settings ])

Same as `load()`, but understands multi-doc sources and apply `iterator` to each
document.

``` javascript
var yaml = require('js-yaml');

// pass the string
fs.readFile('/home/ixti/example.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }

  try {
    yaml.loadAll(data, function (doc) {
      console.log(doc);
    });
  } catch(e) {
    console.log(e);
  }
});
```


### safeLoad (string [ , settings ])

Same as `load()` but uses _safe_ schema - only recommended tags of YAML
specification (no JavaScript-specific tags, e.g. `!!js/regexp`).


### safeLoadAll (string, iterator [ , settings ])

Same as `loadAll()` but uses _safe_ schema - only recommended tags of YAML
specification (no JavaScript-specific tags, e.g. `!!js/regexp`).


### new Schema ({ include, implicit, explicit })

Constructs an object to use by the loader via the `schema` setting described
above. Schemas are collections of YAML type objects collected in `implicit`
and `explicit` arrays. The loader will try to resolve each plain scalar in a
document using the resolver function associeted with each type in the implicit
list. If a node has an explicit tag, the loader will look for it in the both
lists. `include` is an array of super schemas. When compiling a schema, the
loader will take types in bottom-top order; the specified schema comes first,
and all of super schemas come next in order of they are placed in the include
list. Recursively.

There are predifined schemas in JS-YAML: `MINIMAL_SCHEMA`, `SAFE_SCHEMA`, and
`DEFAULT_SCHEMA`.


### new Type (tag, resolver)

Constructs a YAML type definition object. Such objects are used for validation,
resolving, interpreting, and representing of primitive YAML nodes: scalars
(strings), sequences (arrays), and mappings (objects). `resolver` is a function
of two arguments: `object` is a primitive YAML node to resolve and `explicit` is
a boolean value. Then a type is contained in the implicit list of a schema, and
a node has no explicit tag on it, `explicit` will be false. Otherwise, it will
be true.


### NIL

Special object used in type resolvers to represent failure of the resolving
process. If your resolver cannot to resolve the given object, it should return
NIL.


### Example of using your own schema

``` javascript
var yaml = require('js-yaml');

var cookiesType = new yaml.Type('!cookies', function (object, explicit) {
  if ('string' === typeof object) {
    return 'A ' + object + ' with some cookies!';
  } else {
    return yaml.NIL;
  }
});

var COOKIES_SCHEMA = new yaml.Schema({
  include:  [ yaml.DEFAULT_SCHEMA ],
  explicit: [ cookiesType ]
});

console.log(yaml.load('!cookies coffee', { schema: COOKIES_SCHEMA }));
```
=>
```
A coffee with some cookies!
```


## Supported YAML types

The list of standard YAML tags and corresponding JavaScipt types. See also
[YAML tag discussion](http://pyyaml.org/wiki/YAMLTagDiscussion) and
[YAML types repository](http://yaml.org/type/).

```
!!null ''                   # null
!!bool 'yes'                # bool
!!int '3...'                # number
!!float '3.14...'           # number
!!binary '...base64...'     # buffer
!!timestamp 'YYYY-...'      # date
!!omap [ ... ]              # array of key-value pairs
!!pairs [ ... ]             # array or array pairs
!!set { ... }               # array of objects with given keys and null values
!!str '...'                 # string
!!seq [ ... ]               # array
!!map { ... }               # object
```

**JavaScript-specific tags**

```
!!js/regexp /pattern/gim            # RegExp
!!js/undefined ''                   # Undefined
!!js/function 'function () {...}'   # Function
```

## Caveats

Note, that you use arrays or objects as key in JS-YAML. JS do not allows objects
or array as keys, and stringifies (by calling .toString method) them at the
moment of adding them.

``` yaml
---
? [ foo, bar ]
: - baz
? { foo: bar }
: - baz
  - baz
```
=>
``` javascript
{ "foo,bar": ["baz"], "[object Object]": ["baz", "baz"] }
```

Also, reading of properties on implicit block mapping keys is not supported yet.
So, the following YAML document cannot be loaded.

``` yaml
&anchor foo:
  foo: bar
  *anchor: duplicate key
  baz: bat
  *anchor: duplicate key
```

## License

View the [LICENSE](https://github.com/nodeca/js-yaml/blob/master/LICENSE) file
(MIT).
