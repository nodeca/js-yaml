0.3.5 / 2012-01-10

* Workagound for .npmignore fuckup under windows. Thanks to airportyh.

0.3.4 / 2011-12-24
------------------

* Fixes str[] for oldIEs support.
* Adds better has change support for browserified demo.
* improves compact output of Error. Closes #33.

0.3.3 / 2011-12-20
------------------

* jsyaml executable moved to separate module.
* adds `compact` stringification of Errors.

0.3.2 / 2011-12-16
------------------

* Fixes ug with block style scalars. Closes #26.
* All sources are passing JSLint now.
* Fixes bug in Safari. Closes #28.
* Fixes bug in Opers. Closes #29.
* Improves browser support. Closes #20.
* Added jsyaml executable.
* Added !!js/function support. Closes #12.

0.3.1 / 2011-11-18
------------------

* Added AMD support for browserified version.
* Wrapped browserified js-yaml into closure.
* Fixed the resolvement of non-specific tags. Closes #17.
* Added permalinks for online demo YAML snippets. Now we have YPaste service, lol.
* Added !!js/regexp and !!js/undefined types. Partially solves #12.
* Fixed !!set mapping.
* Fixed month parse in dates. Closes #19.

0.3.0 / 2011-11-09
------------------

* Removed JS.Class dependency. Closes #3.
* Added browserified version. Closes #13.
* Added live demo of browserified version.
* Ported some of the PyYAML tests. See #14.
* Fixed timestamp bug when fraction was given.

0.2.2 / 2011-11-06
------------------

* Fixed crash on docs without ---. Closes #8.
* Fixed miltiline string parse
* Fixed tests/comments for using array as key

0.2.1 / 2011-11-02
------------------

* Fixed short file read (<4k). Closes #9.

0.2.0 / 2011-11-02
------------------

* First public release
