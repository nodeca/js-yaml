js-yaml
=======

JS-YAML is a YAML parser for JavaScript. Originally ported from [PyYAML][1].

## Features

- a **complete** YAML 1.1 parser.
- unicode support limited to UTF-8 input and \u escape sequences.
- support for all types from the  [YAML types repository][2].
- relatively sensible error messages.

## Tag Scheme

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

The list of JavaScript specific YAML tags will be availble soon (not implemented
yet) and will include at least RegExp, Undefined and Infinity.


## License

View the [LICENSE][3] file.


[1]: http://pyyaml.org/
[2]: http://yaml.org/type/index.html
[3]: https://github.com/nodeca/js-yaml/blob/master/LICENSE
