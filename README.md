JS-YAML
=======

YAML parser for JavaScript. Originally ported from [PyYAML](http://pyyaml.org/).

(\*) not feature-compleete, more coming soon. See examples.

## Installation

TBD. Just git clone now.

## Usage

``` javascript
var jsyaml = require('js-yaml');
var document = jsyaml.load('---\nhello: world');

console.log(document.hello);
// -> 'world'
```

See `examples/`


### Load by extention

**register(ext\_1[, ext\_2[, ext\_N]]) -> Void**

- _ext\_1_, _ext\_2_, _..._, _ext\_N_ (String)

Register JS-YAML as default file handler for specified extension(s).

``` javascript

jsyaml.register('yml', 'yaml');

var docs = require('/home/ixti/examples.yml');
docs.forEach(function (doc) {
  // ...
});
```


### Load single doc

**load(stream) -> Object**

- _stream_ (String|Buffer|File Resource) YAML source

Parse the single YAML document in a stream and produce the corresponding
JavaScript object.

``` javascript
// pass the string
fs.readFile('/home/ixti/example.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }

  var doc = jsyaml.load(data);
});
```


### Load multiple doc

**loadAll(stream) -> Array**

- _stream_ (String|Buffer|File Resource) YAML source

Parse the all YAML documents in a stream and produce array of corresponding
JavaScript objects.

``` javascript
// pass the string
fs.readFile('/home/ixti/examples.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }

  jsyaml.loadAll(data).forEach(function (doc) {
    // ...
  });
});
```


## Comparison to visionmedia's yaml parser

All files that can be parsed with visionmedia's yaml parser can be parsed by
JS-YAML, except those, which are not VALID:

* `examples/visionmedia-compat/hash.yml` contains invalid YAML document.
  Unquoted strings cannot start with `{` or `[`.


## JsTagScheme

The list of standard YAML tags and corresponding JavaScipt types.

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
yet) and will include at least RegExp, Undefined and Infinity.

See also [YAMLTagDiscussion](http://pyyaml.org/wiki/YAMLTagDiscussion) and [Yaml Types](http://yaml.org/type/).


## Versioning

For transparency and insight into our release cycle, and for striving to
maintain backwards compatibility, JS-YAML will be maintained under
the Semantic Versioning guidelines as much as possible.

Releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on SemVer, please visit http://semver.org/.


## License

View the [LICENSE](https://github.com/nodeca/js-yaml/blob/master/LICENSE) file
