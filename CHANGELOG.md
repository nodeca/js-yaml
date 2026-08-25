# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [5.4.0] - 2026-08-25

### Added
- Added the `scalarStyleRules` dumper option to customize string formatting.
  See [Scalar styling](docs/scalar_styling.md) for details.

### Changed
- [breaking] Flattened the low-level AST node style representation. Scalar
  and collection nodes now use `SCALAR_STYLE` and `COLLECTION_STYLE` values;
  explicit tags use the separate `tagged` property. Alias nodes now contain
  only `kind` and `anchor`. This only affects code that directly constructs or
  edits AST nodes.
- [breaking] The `sortKeys` option was rewritten using AST mutation to avoid
  side effects.
- Reworked scalar style selection. This can change formatting without changing
  loaded values; in particular, whitespace-only strings are now double-quoted.

### Fixed
- Accept a byte order mark at the start of each document in a stream, #791.
- Produce valid flow mappings with `quoteFlowKeys` and `flowSkipColonSpace`,
  including alias and property-only keys, #786.
- Preserve empty scalar items when converting block sequences to flow style.
- Do not apply the 1024-character simple-key limit to flow mapping keys.
- Count Unicode code points, rather than UTF-16 code units, for the
  1024-character simple-key limit.
- Add an explicit document-end marker after keep-chomped block scalars when
  needed to preserve trailing newlines.


## [5.3.0] - 2026-08-14

This release focuses on reworking the documentation and making small
architectural improvements before moving forward.

### Added
- Added completely new documentation.
- Exported `DUMP_SCHEMA`, the default schema used by the dumper.
- Added `YAMLException.throwAt()` for throwing an error at a source position.

### Changed
- Changed flat constant exports to grouped exports: `EVENT_ID`, `SCALAR_STYLE`,
  `COLLECTION_STYLE`, and `CHOMPING_MODE`, along with their value types. The old
  exports are still preserved, but deprecated.
- Made `identify` mandatory for custom tag definitions. Use
  `identify: () => false` for load-only tags.

### Deprecated
- Deprecated flat constant exports. Use grouped ones instead.

### Removed
- Removed the `MERGE_KEY` export (not used anymore after last fixes).

### Fixed
- Validate `<<` sequence items at merge time, so aliased merge sources are
  checked too.
- Resolve `<<` outside of a mapping key as the plain string `'<<'`, matching
  v4, instead of leaking an internal symbol into the result.


## [5.2.3] - 2026-08-01

### Fixed
- Prevent prototype fallback when resolving tags and mapping entries, #782.
- Resolve `!!timestamp` years 0000-0099 correctly, #775.
- Preserve implicit null mapping values before document markers and reject
  unpaired mapping event streams, #784.
- Preserve folded scalar values with tab-indented lines when round-tripping a
  parsed AST through `present()`; `dump()` and loading are unaffected, #780.


## [5.2.2] - 2026-07-24

### Fixed
- Quote flow scalars where a colon precedes a flow indicator, #773.

### Security
- Avoid exponential parsing time for nested flow sequence pairs.


## [5.2.1] - 2026-07-02

### Fixed
- Add `Map` support to !!omap (should work when `realMapTag` used)

### Security
- Remove quadratic complexity from !!omap `addItem`. Regression from v5
  (usually not critical, because YAML11_SCHEMA is not default anymore).


## 4.3.0, 3.15.0 - 2026-06-27
### Security
- Backported `maxTotalMergeKeys` option.


## [5.2.0] - 2026-06-26
### Added
- Added `maxTotalMergeKeys` (10000) loader option to limit the total number of
  keys processed by YAML merge (`<<`) across one `load()` / `loadAll()` call.
- Added `maxAliases` (-1) loader option to limit the number of YAML aliases per
  document.

### Removed
- `maxMergeSeqLength` replaced with `maxTotalMergeKeys` for limiting YAML merge
  processing.

### Fixed
- Round-trip of integers with exponential form (>= `1e21`)

## [5.1.0] - 2026-06-23
### Added
- Collection tags can finalize an incrementally populated carrier into a
  different result value.

### Changed
- [breaking] `quoteStyle` now selects the preferred quote style; use the
  restored `forceQuotes` option to force quoting non-key strings.


## [5.0.0] - 2026-06-20
### Added
- Added named exports for schemas, tags, parser events and AST utilities.
- Reworked `JSON_SCHEMA` and `CORE_SCHEMA` with spec-compliant scalar resolution
  rules, and added `YAML11_SCHEMA`.
- Added `realMapTag` for lossless mappings with non-string and complex keys.
  Object-based mappings now reject complex keys instead of stringifying them.
- Added `dump()` `transform` option for changing the generated AST before
  rendering.
- Added `dump()` options `seqInlineFirst`, `flowBracketPadding`,
  `flowSkipCommaSpace`, `flowSkipColonSpace`, `quoteFlowKeys`, `quoteStyle` and
  `tagBeforeAnchor`.
- Added formal data layers (events and AST) for modular data pipelines.
  - Added low-level parser (to events), presenter and visitor APIs.
- Added the [YAML Test Suite](https://github.com/yaml/yaml-test-suite) to the
  test set.

### Changed
- See the [migration guide](docs/migrate_v4_to_v5.md) for upgrade notes.
- Rewritten in TypeScript and reorganized the public API around flat named
  exports.
- Reduced the set of exported schemas:
  - YAML 1.2 schemas: `CORE_SCHEMA` (loader default), `JSON_SCHEMA`,
    `FAILSAFE_SCHEMA`.
  - `YAML11_SCHEMA`, a combination of all YAML 1.1 tags (YAML 1.1 does not
    specify a schema, only "types").
- `load`/`dump` default behaviour is now specified exactly via schemas:
  - `load` uses `CORE_SCHEMA`, without `!!merge` by default.
  - `dump` uses `YAML11_SCHEMA` + `CORE_SCHEMA` for the quoting check, to
    guarantee backward compatibility by default.
- `!!set` is now loaded as a JavaScript `Set`.
- Replaced the `Type` API with a tags API. Similar, but more precise and
  simpler. See examples for details. Tags can be defined via
  `defineScalarTag()`, `defineSequenceTag()` and `defineMappingTag()`, or as a
  spread + override of an existing tag.
- Renamed `Schema.extend()` to `Schema.withTags()`.
- Expanded YAML 1.2 conformance and improved handling of directives, document
  markers, block keys, multiline scalars, tag syntax and other things.
- `load()` now throws on empty input instead of returning `undefined`.
- Moved browser builds to the `js-yaml/browser` export.
- Deprecated the `loadAll` signature with an iterator (still works, but is a
  candidate for removal).

### Removed
- Removed deprecated `safeLoad()`, `safeLoadAll()` and `safeDump()` exports.
- Removed `DEFAULT_SCHEMA` and the nested `types` export.
- Removed loader options `onWarning`, `legacy` and `listener`.
- Removed dumper options `styles`, `replacer`, `noCompatMode`, `condenseFlow`,
  `quotingType` and `forceQuotes`. Renamed `noArrayIndent` to `seqNoIndent`.
  Formatting and representation are now configured through presenter options,
  schemas and tag definitions. See migration guide on how to replace.
- Removed support for importing internal files from `lib/`.


## [4.2.0] - 2026-06-01
### Added
- Added `docs/safety.md` with notes about processing untrusted YAML.
- Added `maxDepth` (100) loader option. Not a problem, but gives a better
  exception instead of RangeError on stack overflow.
- Added a loader option limiting merge sequence length. Not a problem after
  `merge` fix, but an additional restriction for safety.
- Added sourcemaps to `dist/` builds.

### Changed
- Stop resolving numbers with underscores as numeric scalars, #627.
- Switched dev toolchains to Vite / neostandard.
- Updated demo.
- Reorganized tests.
- `dist/` files are no longer kept in the repository.

### Fixed
- Fix parsing of properties on the first implicit block mapping key, #62.
- Fix trailing whitespace handling when folding flow scalar lines, #307.
- Reject top-level block scalars without content indentation, #280.
- Ensure numbers survive round-trip, #737.
- Fix test coverage for issue #221.
- Fix flow scalar trailing whitespace folding, #307.
- Fix digits in YAML named tag handles.

### Security
- Fix potential DoS via quadratic complexity in merge - deduplicate repeated
  elements (makes sense for malformed files > 10K).


## [3.14.2] - 2025-11-15
### Security
- Backported v4.1.1 fix to v3


## [4.1.1] - 2025-11-12
### Security
- Fix prototype pollution issue in yaml merge (<<) operator.


## [4.1.0] - 2021-04-15
### Added
- Types are now exported as `yaml.types.XXX`.
- Every type now has `options` property with original arguments kept as they were
  (see `yaml.types.int.options` as an example).

### Changed
- `Schema.extend()` now keeps old type order in case of conflicts
  (e.g. Schema.extend([ a, b, c ]).extend([ b, a, d ]) is now ordered as `abcd` instead of `cbad`).


## [4.0.0] - 2021-01-03
### Changed
- Check migration guide for details of all breaking changes.
- Breaking: "unsafe" tags `!!js/function`, `!!js/regexp`, `!!js/undefined` are
  moved to [js-yaml-js-types](https://github.com/nodeca/js-yaml-js-types) package.
- Breaking: removed `safe*` functions. Use `load`, `loadAll`, `dump`
  instead which are all now safe by default.
- `yaml.DEFAULT_SAFE_SCHEMA` and `yaml.DEFAULT_FULL_SCHEMA` are removed, use
  `yaml.DEFAULT_SCHEMA` instead.
- `yaml.Schema.create(schema, tags)` is removed, use `schema.extend(tags)` instead.
- `!!binary` now always mapped to `Uint8Array` on load.
- Reduced nesting of `/lib` folder.
- Parse numbers according to YAML 1.2 instead of YAML 1.1 (`01234` is now decimal,
  `0o1234` is octal, `1:23` is parsed as string instead of base60).
- `dump()` no longer quotes `:`, `[`, `]`, `(`, `)` except when necessary, #470, #557.
- Line and column in exceptions are now formatted as `(X:Y)` instead of
  `at line X, column Y` (also present in compact format), #332.
- Code snippet created in exceptions now contains multiple lines with line numbers.
- `dump()` now serializes `undefined` as `null` in collections and removes keys with
  `undefined` in mappings, #571.
- Custom tags starting with `!` are now dumped as `!tag` instead of `!<!tag>`, #576.
- Custom tags starting with `tag:yaml.org,2002:` are now shorthanded using `!!`, #258.

### Added
- Added `.mjs` (es modules) support.
- Added `quotingType` and `forceQuotes` options for dumper to configure
  string literal style, #290, #529.
- Added `styles: { '!!null': 'empty' }` option for dumper
  (serializes `{ foo: null }` as "`foo: `"), #570.
- Added `replacer` option (similar to option in JSON.stringify), #339.
- Custom `Tag` can now handle all tags or multiple tags with the same prefix, #385.

### Fixed
- Astral characters are no longer encoded by `dump()`, #587.
- "duplicate mapping key" exception now points at the correct column, #452.
- Extra commas in flow collections (e.g. `[foo,,bar]`) now throw an exception
  instead of producing null, #321.
- `__proto__` key no longer overrides object prototype, #164.
- Removed `bower.json`.
- Tags are now url-decoded in `load()` and url-encoded in `dump()`
  (previously usage of custom non-ascii tags may have led to invalid YAML that can't be parsed).
- Anchors now work correctly with empty nodes, #301.
- Fix incorrect parsing of invalid block mapping syntax, #418.
- Throw an error if block sequence/mapping indent contains a tab, #80.


## [3.14.1] - 2020-12-07
### Security
- Fix possible code execution in (already unsafe) `.load()` (in &anchor).


## [3.14.0] - 2020-05-22
### Changed
- Support `safe/loadAll(input, options)` variant of call.
- CI: drop outdated nodejs versions.
- Dev deps bump.

### Fixed
- Quote `=` in plain scalars #519.
- Check the node type for `!<?>` tag in case user manually specifies it.
- Verify that there are no null-bytes in input.
- Fix wrong quote position when writing condensed flow, #526.


## [3.13.1] - 2019-04-05
### Security
- Fix possible code execution in (already unsafe) `.load()`, #480.


## [3.13.0] - 2019-03-20
### Security
- Security fix: `safeLoad()` can hang when arrays with nested refs
  used as key. Now throws exception for nested arrays. #475.


## [3.12.2] - 2019-02-26
### Fixed
- Fix `noArrayIndent` option for root level, #468.


## [3.12.1] - 2019-01-05
### Added
- Added `noArrayIndent` option, #432.


## [3.12.0] - 2018-06-02
### Changed
- Support arrow functions without a block statement, #421.


## [3.11.0] - 2018-03-05
### Added
- Add arrow functions suport for `!!js/function`.

### Fixed
- Fix dump in bin/octal/hex formats for negative integers, #399.


## [3.10.0] - 2017-09-10
### Fixed
- Fix `condenseFlow` output (quote keys for sure, instead of spaces), #371, #370.
- Dump astrals as codepoints instead of surrogate pair, #368.


## [3.9.1] - 2017-07-08
### Fixed
- Ensure stack is present for custom errors in node 7.+, #351.


## [3.9.0] - 2017-07-08
### Added
- Add `condenseFlow` option (to create pretty URL query params), #346.

### Fixed
- Support array return from safeLoadAll/loadAll, #350.


## [3.8.4] - 2017-05-08
### Fixed
- Dumper: prevent space after dash for arrays that wrap, #343.


## [3.8.3] - 2017-04-05
### Fixed
- Should not allow numbers to begin and end with underscore, #335.


## [3.8.2] - 2017-03-02
### Fixed
- Fix `!!float 123` (integers) parse, #333.
- Don't allow leading zeros in floats (except 0, 0.xxx).
- Allow positive exponent without sign in floats.


## [3.8.1] - 2017-02-07
### Changed
- Maintenance: update browserified build.


## [3.8.0] - 2017-02-07
### Fixed
- Fix reported position for `duplicated mapping key` errors.
  Now points to block start instead of block end.
  (#243, thanks to @shockey).


## [3.7.0] - 2016-11-12
### Added
- Support polymorphism for tags (#300, thanks to @monken).

### Fixed
- Fix parsing of quotes followed by newlines (#304, thanks to @dplepage).


## [3.6.1] - 2016-05-11
### Fixed
- Fix output cut on a pipe, #286.


## [3.6.0] - 2016-04-16
### Fixed
- Dumper rewrite, fix multiple bugs with trailing `\n`.
  Big thanks to @aepsilon!
- Loader: fix leading/trailing newlines in block scalars, @aepsilon.


## [3.5.5] - 2016-03-17
### Fixed
- Date parse fix: don't allow dates with on digit in month and day, #268.


## [3.5.4] - 2016-03-09
### Added
- `noCompatMode` for dumper, to disable quoting YAML 1.1 values.


## [3.5.3] - 2016-02-11
### Changed
- Maintenance release.


## [3.5.2] - 2016-01-11
### Changed
- Maintenance: missed comma in bower config.


## [3.5.1] - 2016-01-11
### Changed
- Removed `inherit` dependency, #239.
- Better browserify workaround for esprima load.
- Demo rewrite.


## [3.5.0] - 2016-01-10
### Fixed
- Dumper. Fold strings only, #217.
- Dumper. `norefs` option, to clone linked objects, #229.
- Loader. Throw a warning for duplicate keys, #166.
- Improved browserify support (mark `esprima` & `Buffer` excluded).


## [3.4.6] - 2015-11-26
### Changed
- Use standalone `inherit` to keep browserified files clear.


## [3.4.5] - 2015-11-23
### Added
- Added `lineWidth` option to dumper.


## [3.4.4] - 2015-11-21
### Fixed
- Fixed floats dump (missed dot for scientific format), #220.
- Allow non-printable characters inside quoted scalars, #192.


## [3.4.3] - 2015-10-10
### Changed
- Maintenance release - deps bump (esprima, argparse).


## [3.4.2] - 2015-09-09
### Fixed
- Fixed serialization of duplicated entries in sequences, #205.
  Thanks to @vogelsgesang.


## [3.4.1] - 2015-09-05
### Fixed
- Fixed stacktrace handling in generated errors, for browsers (FF/IE).


## [3.4.0] - 2015-08-23
### Changed
- Don't throw on warnings anymore. Use `onWarning` option to catch.
- Throw error on unknown tags (was warning before).
- Reworked internals of error class.

### Fixed
- Fixed multiline keys dump, #197. Thanks to @tcr.
- Fixed heading line breaks in some scalars (regression).


## [3.3.1] - 2015-05-13
### Added
- Added `.sortKeys` dumper option, thanks to @rjmunro.

### Fixed
- Fixed astral characters support, #191.


## [3.3.0] - 2015-04-26
### Changed
- Significantly improved long strings formatting in dumper, thanks to @isaacs.
- Strip BOM if exists.


## [3.2.7] - 2015-02-19
### Changed
- Maintenance release.
- Updated dependencies.
- HISTORY.md -> CHANGELOG.md


## [3.2.6] - 2015-02-07
### Fixed
- Fixed encoding of UTF-16 surrogate pairs. (e.g. "\U0001F431" CAT FACE).
- Fixed demo dates dump (#113, thanks to @Hypercubed).


## [3.2.5] - 2014-12-28
### Fixed
- Fixed resolving of all built-in types on empty nodes.
- Fixed invalid warning on empty lines within quoted scalars and flow collections.
- Fixed bug: Tag on an empty node didn't resolve in some cases.


## [3.2.4] - 2014-12-19
### Fixed
- Fixed resolving of !!null tag on an empty node.


## [3.2.3] - 2014-11-08
### Fixed
- Implemented dumping of objects with circular and cross references.
- Partially fixed aliasing of constructed objects. (see issue #141 for details)


## [3.2.2] - 2014-09-07
### Fixed
- Fixed infinite loop on unindented block scalars.
- Rewritten base64 encode/decode in binary type, to keep code licence clear.


## [3.2.1] - 2014-08-24
### Fixed
- Nothig new. Just fix npm publish error.


## [3.2.0] - 2014-08-24
### Added
- Added input piping support to CLI.

### Fixed
- Fixed typo, that could cause hand on initial indent (#139).


## [3.1.0] - 2014-07-07
### Changed
- 1.5x-2x speed boost.
- Removed deprecated `require('xxx.yml')` support.
- Significant code cleanup and refactoring.
- Internal API changed. If you used custom types - see updated examples.
  Others are not affected.
- Even if the input string has no trailing line break character,
  it will be parsed as if it has one.
- Added benchmark scripts.
- Moved bower files to /dist folder
- Bugfixes.


## [3.0.2] - 2014-02-27
### Fixed
- Fixed bug: "constructor" string parsed as `null`.


## [3.0.1] - 2013-12-22
### Fixed
- Fixed parsing of literal scalars. (issue #108)
- Prevented adding unnecessary spaces in object dumps. (issue #68)
- Fixed dumping of objects with very long (> 1024 in length) keys.


## [3.0.0] - 2013-12-16
### Changed
- Refactored code. Changed API for custom types.
- Removed output colors in CLI, dump json by default.
- Removed big dependencies from browser version (esprima, buffer). Load `esprima` manually, if `!!js/function` needed. `!!bin` now returns Array in browser
- AMD support.
- Don't quote dumped strings because of `-` & `?` (if not first char).
- __Deprecated__ loading yaml files via `require()`, as not recommended
  behaviour for node.


## [2.1.3] - 2013-10-16
### Fixed
- Fix wrong loading of empty block scalars.


## [2.1.2] - 2013-10-07
### Fixed
- Fix unwanted line breaks in folded scalars.


## [2.1.1] - 2013-10-02
### Fixed
- Dumper now respects deprecated booleans syntax from YAML 1.0/1.1
- Fixed reader bug in JSON-like sequences/mappings.


## [2.1.0] - 2013-06-05
### Added
- Add standard YAML schemas: Failsafe (`FAILSAFE_SCHEMA`),
  JSON (`JSON_SCHEMA`) and Core (`CORE_SCHEMA`).
- Add `skipInvalid` dumper option.

### Changed
- Rename `DEFAULT_SCHEMA` to `DEFAULT_FULL_SCHEMA`
  and `SAFE_SCHEMA` to `DEFAULT_SAFE_SCHEMA`.
- Use `safeLoad` for `require` extension.

### Fixed
- Bug fix: export `NIL` constant from the public interface.


## [2.0.5] - 2013-04-26
### Security
- Close security issue in !!js/function constructor.
  Big thanks to @nealpoole for security audit.


## [2.0.4] - 2013-04-08
### Changed
- Updated .npmignore to reduce package size


## [2.0.3] - 2013-02-26
### Fixed
- Fixed dumping of empty arrays ans objects. ([] and {} instead of null)


## [2.0.2] - 2013-02-15
### Fixed
- Fixed input validation: tabs are printable characters.


## [2.0.1] - 2013-02-09
### Fixed
- Fixed error, when options not passed to function cass


## [2.0.0] - 2013-02-09
### Changed
- Full rewrite. New architecture. Fast one-stage parsing.
- Changed custom types API.
- Added YAML dumper.


## [1.0.3] - 2012-11-05
### Fixed
- Fixed utf-8 files loading.


## [1.0.2] - 2012-08-02
### Fixed
- Pull out hand-written shims. Use ES5-Shims for old browsers support. See #44.
- Fix timstamps incorectly parsed in local time when no time part specified.


## [1.0.1] - 2012-07-07
### Fixed
- Fixes `TypeError: 'undefined' is not an object` under Safari. Thanks Phuong.
- Fix timestamps incorrectly parsed in local time. Thanks @caolan. Closes #46.


## [1.0.0] - 2012-07-01
### Changed
- `y`, `yes`, `n`, `no`, `on`, `off` are not converted to Booleans anymore.
  Fixes #42.
- `require(filename)` now returns a single document and throws an Error if
  file contains more than one document.
- CLI was merged back from js-yaml.bin


## [0.3.7] - 2012-02-28
### Fixed
- Fix export of `addConstructor()`. Closes #39.


## [0.3.6] - 2012-02-22
### Changed
- Removed AMD parts - too buggy to use. Need help to rewrite from scratch

### Fixed
- Removed YUI compressor warning (renamed `double` variable). Closes #40.


## [0.3.5] - 2012-01-10
### Fixed
- Workagound for .npmignore fuckup under windows. Thanks to airportyh.


## [0.3.4] - 2011-12-24
### Fixed
- Fixes str[] for oldIEs support.
- Adds better has change support for browserified demo.
- improves compact output of Error. Closes #33.


## [0.3.3] - 2011-12-20
### Added
- adds `compact` stringification of Errors.

### Changed
- jsyaml executable moved to separate module.


## [0.3.2] - 2011-12-16
### Added
- Added jsyaml executable.
- Added !!js/function support. Closes #12.

### Fixed
- Fixes ug with block style scalars. Closes #26.
- All sources are passing JSLint now.
- Fixes bug in Safari. Closes #28.
- Fixes bug in Opers. Closes #29.
- Improves browser support. Closes #20.


## [0.3.1] - 2011-11-18
### Added
- Added AMD support for browserified version.
- Added permalinks for online demo YAML snippets. Now we have YPaste service, lol.
- Added !!js/regexp and !!js/undefined types. Partially solves #12.

### Changed
- Wrapped browserified js-yaml into closure.

### Fixed
- Fixed the resolvement of non-specific tags. Closes #17.
- Fixed !!set mapping.
- Fixed month parse in dates. Closes #19.


## [0.3.0] - 2011-11-09
### Added
- Added browserified version. Closes #13.
- Added live demo of browserified version.
- Ported some of the PyYAML tests. See #14.

### Fixed
- Removed JS.Class dependency. Closes #3.
- Fixed timestamp bug when fraction was given.


## [0.2.2] - 2011-11-06
### Fixed
- Fixed crash on docs without ---. Closes #8.
- Fixed multiline string parse
- Fixed tests/comments for using array as key


## [0.2.1] - 2011-11-02
### Fixed
- Fixed short file read (<4k). Closes #9.


## [0.2.0] - 2011-11-02
### Changed
- First public release


[5.4.0]: https://github.com/nodeca/js-yaml/compare/5.3.0...5.4.0
[5.3.0]: https://github.com/nodeca/js-yaml/compare/5.2.3...5.3.0
[5.2.3]: https://github.com/nodeca/js-yaml/compare/5.2.2...5.2.3
[5.2.2]: https://github.com/nodeca/js-yaml/compare/5.2.1...5.2.2
[5.2.1]: https://github.com/nodeca/js-yaml/compare/5.2.0...5.2.1
[5.2.0]: https://github.com/nodeca/js-yaml/compare/5.1.0...5.2.0
[5.1.0]: https://github.com/nodeca/js-yaml/compare/5.0.0...5.1.0
[5.0.0]: https://github.com/nodeca/js-yaml/compare/4.2.0...5.0.0
[4.2.0]: https://github.com/nodeca/js-yaml/compare/4.1.1...4.2.0
[4.1.1]: https://github.com/nodeca/js-yaml/compare/4.1.0...4.1.1
[4.1.0]: https://github.com/nodeca/js-yaml/compare/4.0.0...4.1.0
[4.0.0]: https://github.com/nodeca/js-yaml/compare/3.14.0...4.0.0
[3.14.2]: https://github.com/nodeca/js-yaml/compare/3.14.1...3.14.2
[3.14.1]: https://github.com/nodeca/js-yaml/compare/3.14.0...3.14.1
[3.14.0]: https://github.com/nodeca/js-yaml/compare/3.13.1...3.14.0
[3.13.1]: https://github.com/nodeca/js-yaml/compare/3.13.0...3.13.1
[3.13.0]: https://github.com/nodeca/js-yaml/compare/3.12.2...3.13.0
[3.12.2]: https://github.com/nodeca/js-yaml/compare/3.12.1...3.12.2
[3.12.1]: https://github.com/nodeca/js-yaml/compare/3.12.0...3.12.1
[3.12.0]: https://github.com/nodeca/js-yaml/compare/3.11.0...3.12.0
[3.11.0]: https://github.com/nodeca/js-yaml/compare/3.10.0...3.11.0
[3.10.0]: https://github.com/nodeca/js-yaml/compare/3.9.1...3.10.0
[3.9.1]: https://github.com/nodeca/js-yaml/compare/3.9.0...3.9.1
[3.9.0]: https://github.com/nodeca/js-yaml/compare/3.8.4...3.9.0
[3.8.4]: https://github.com/nodeca/js-yaml/compare/3.8.3...3.8.4
[3.8.3]: https://github.com/nodeca/js-yaml/compare/3.8.2...3.8.3
[3.8.2]: https://github.com/nodeca/js-yaml/compare/3.8.1...3.8.2
[3.8.1]: https://github.com/nodeca/js-yaml/compare/3.8.0...3.8.1
[3.8.0]: https://github.com/nodeca/js-yaml/compare/3.7.0...3.8.0
[3.7.0]: https://github.com/nodeca/js-yaml/compare/3.6.1...3.7.0
[3.6.1]: https://github.com/nodeca/js-yaml/compare/3.6.0...3.6.1
[3.6.0]: https://github.com/nodeca/js-yaml/compare/3.5.5...3.6.0
[3.5.5]: https://github.com/nodeca/js-yaml/compare/3.5.4...3.5.5
[3.5.4]: https://github.com/nodeca/js-yaml/compare/3.5.3...3.5.4
[3.5.3]: https://github.com/nodeca/js-yaml/compare/3.5.2...3.5.3
[3.5.2]: https://github.com/nodeca/js-yaml/compare/3.5.1...3.5.2
[3.5.1]: https://github.com/nodeca/js-yaml/compare/3.5.0...3.5.1
[3.5.0]: https://github.com/nodeca/js-yaml/compare/3.4.6...3.5.0
[3.4.6]: https://github.com/nodeca/js-yaml/compare/3.4.5...3.4.6
[3.4.5]: https://github.com/nodeca/js-yaml/compare/3.4.4...3.4.5
[3.4.4]: https://github.com/nodeca/js-yaml/compare/3.4.3...3.4.4
[3.4.3]: https://github.com/nodeca/js-yaml/compare/3.4.2...3.4.3
[3.4.2]: https://github.com/nodeca/js-yaml/compare/3.4.1...3.4.2
[3.4.1]: https://github.com/nodeca/js-yaml/compare/3.4.0...3.4.1
[3.4.0]: https://github.com/nodeca/js-yaml/compare/3.3.1...3.4.0
[3.3.1]: https://github.com/nodeca/js-yaml/compare/3.3.0...3.3.1
[3.3.0]: https://github.com/nodeca/js-yaml/compare/3.2.7...3.3.0
[3.2.7]: https://github.com/nodeca/js-yaml/compare/3.2.6...3.2.7
[3.2.6]: https://github.com/nodeca/js-yaml/compare/3.2.5...3.2.6
[3.2.5]: https://github.com/nodeca/js-yaml/compare/3.2.4...3.2.5
[3.2.4]: https://github.com/nodeca/js-yaml/compare/3.2.3...3.2.4
[3.2.3]: https://github.com/nodeca/js-yaml/compare/3.2.2...3.2.3
[3.2.2]: https://github.com/nodeca/js-yaml/compare/3.2.1...3.2.2
[3.2.1]: https://github.com/nodeca/js-yaml/compare/3.2.0...3.2.1
[3.2.0]: https://github.com/nodeca/js-yaml/compare/3.1.0...3.2.0
[3.1.0]: https://github.com/nodeca/js-yaml/compare/3.0.2...3.1.0
[3.0.2]: https://github.com/nodeca/js-yaml/compare/3.0.1...3.0.2
[3.0.1]: https://github.com/nodeca/js-yaml/compare/3.0.0...3.0.1
[3.0.0]: https://github.com/nodeca/js-yaml/compare/2.1.3...3.0.0
[2.1.3]: https://github.com/nodeca/js-yaml/compare/2.1.2...2.1.3
[2.1.2]: https://github.com/nodeca/js-yaml/compare/2.1.1...2.1.2
[2.1.1]: https://github.com/nodeca/js-yaml/compare/2.1.0...2.1.1
[2.1.0]: https://github.com/nodeca/js-yaml/compare/2.0.5...2.1.0
[2.0.5]: https://github.com/nodeca/js-yaml/compare/2.0.4...2.0.5
[2.0.4]: https://github.com/nodeca/js-yaml/compare/2.0.3...2.0.4
[2.0.3]: https://github.com/nodeca/js-yaml/compare/2.0.2...2.0.3
[2.0.2]: https://github.com/nodeca/js-yaml/compare/2.0.1...2.0.2
[2.0.1]: https://github.com/nodeca/js-yaml/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/nodeca/js-yaml/compare/1.0.3...2.0.0
[1.0.3]: https://github.com/nodeca/js-yaml/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/nodeca/js-yaml/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/nodeca/js-yaml/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/nodeca/js-yaml/compare/0.3.7...1.0.0
[0.3.7]: https://github.com/nodeca/js-yaml/compare/0.3.6...0.3.7
[0.3.6]: https://github.com/nodeca/js-yaml/compare/0.3.5...0.3.6
[0.3.5]: https://github.com/nodeca/js-yaml/compare/0.3.4...0.3.5
[0.3.4]: https://github.com/nodeca/js-yaml/compare/0.3.3...0.3.4
[0.3.3]: https://github.com/nodeca/js-yaml/compare/0.3.2...0.3.3
[0.3.2]: https://github.com/nodeca/js-yaml/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/nodeca/js-yaml/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/nodeca/js-yaml/compare/0.2.2...0.3.0
[0.2.2]: https://github.com/nodeca/js-yaml/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/nodeca/js-yaml/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/nodeca/js-yaml/releases/tag/0.2.0
