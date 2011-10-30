NOTES
=====


Not implemented Yet
-------------------

- Safe types like omap, etc. (Composer)
- Work with other than utf-8 charsets (Reader)
- Experimental API methods (Resolver)


Future Refactoring
------------------

- Implement lightweight Hashtable implementation and replace JS.Hash:
  - `constructor.js`
- Remove Hashable type (used as mixin for Node and in conditional test in
  Constructor)
- Replace JS.Class with something lightweight (own implementation similar to
  Python notation? - requirements: mixins, exensions, correct inheritance of
  static methods and properties, to be able check `cls.__dict__.include('foo'))
