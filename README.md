JS-YAML
=======

YAML parser for JavaScript. Originally ported from [PyYAML](http://pyyaml.org/).

(*) not feature-compleete, more coming soon. See examples.

## Installation

TBD. Just git clone now.

## Usage

TBD.

### Load by extention

### Load single doc

### Load multiple doc

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

## License

View the [LICENSE](https://github.com/nodeca/js-yaml/blob/master/LICENSE) file