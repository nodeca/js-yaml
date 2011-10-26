yamler
======


Development
-----------

To enable debug output you need to set `JSYAML_DEBUG` environment variable to 1.
Example:

``` bash
export JSYAML_DEBUG=1
node myapp.js
```

When debug enabled, you can limit amount of debug function calls by setting
`JSYAML_MAX_CALLS` to amount you want. By default `0` - no limits. This is
useful for debugging dead-loops. Example:

``` bash
export JSYAML_MAX_CALLS=1000
node myapp.js
```
