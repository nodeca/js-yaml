JS-YAML
=======

YAML 1.1 parser for JavaScript. Originally ported from [PyYAML](http://pyyaml.org/).

(\*) Not feature-compleete, more coming soon:

- YAML 1.2 support
- writer
- JS-specific tags
- internal API for complex operations

## Installation

For node.js:

    npm install js-yaml

## API

See examples in `examples/` folder.


### register( ['yml','yaml',...] )

register JS-YAML as default file handler for specified extension(s). If no extensions defined, then
use 'yml' & 'yaml' by default.

After registration you can just call `require` instead of `loadAll` method.

``` javascript
require('js-yaml').register('yml', 'yaml'); // or even more simple: require('js-yaml').register();

var docs = require('/home/ixti/examples.yml'); // Returns array of documents, or throw exception on error

console.log(docs);
```


### load( string|buffer|file_resource )

Parses source as single YAML document. Returns JS object or throws exception on error.

This function does NOT understands multi-doc sources, it throws exception on those.

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


### loadAll( string|buffer|file_resource )

The same as `Load`, but understands multi-doc sources and returns array of JS objects.

``` javascript
var yaml = require('js-yaml');

// pass the string
fs.readFile('/home/ixti/example.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }
  try {
    console.log( yaml.loadAll(data) );
  } catch(e) {
    console.log(e);
  }
});
```


## JsTagScheme

The list of standard YAML tags and corresponding JavaScipt types. See also
[YAMLTagDiscussion](http://pyyaml.org/wiki/YAMLTagDiscussion) and [Yaml Types](http://yaml.org/type/).

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

The list of JS-specific YAML tags will be availble soon (not implemented
yet) and will probably include RegExp, Undefined, function and Infinity.


## License

View the [LICENSE](https://github.com/nodeca/js-yaml/blob/master/LICENSE) file
