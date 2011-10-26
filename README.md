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

If you are contributor and want to add debug output to some method please check
if debug mode is enabled to reduce resources usage on creation of params object,
e.g.:

``` javascript
// file: ./lib/js-yaml/foobar.js
var debug = require('./debug');

// ...

if (debug.ENABLED) {
  debug('My message', {foo: 1, bar: 2});
}
```
