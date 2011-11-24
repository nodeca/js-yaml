0.3.1 / 2011-11-18
---------

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
