Gotchas and Kludges
-------------------

Expose class properties into instance
=====================================

Example:

``` javascript
function BaseConstructor() {
  // ...
  this.yamlConstructors = BaseConstructor.yamlConstructors;
  // ...
}

BaseConstructor.yamlConstructors = {};
```

Some of instance methods needs access to "class properties". Normally we would
use:

``` javascript
Foo.prototype.bar = function bar(key) {
  return this.constructor.yamlConstructors[key];
}
```

And this will work, if you will work ONLY with Foo or its childs. But we glue
modules (like SafeConstructor, Resolver, Composer, etc.) together via Loader.
So we call `BaseResolver#resolve` via `Resolver` from within `Loader` instance.
So `this.constructor` in the exampe above will be `Loader()` and not `Resolver`
as we might expect it.
