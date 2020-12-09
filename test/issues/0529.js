'use strict';

/* eslint-disable max-len */

const assert = require('assert');
const yaml = require('../../');

const sample = {
  // normal key-value pair
  simple_key: 'value',

  // special characters in key
  'foo\'bar"baz': 1,

  // non-printables in key
  'foo\vbar': 1,

  // multiline key
  'foo\nbar\nbaz': 1,

  // ambiguous type, looks like a number
  '0x1234': 1,
  ambiguous: '0x1234',

  // ambiguous type, looks like a quoted string
  "'foo'": 1,
  ambiguous1: "'foo'",
  '"foo"': 1,
  ambiguous2: '"foo"',

  // quote in output
  quote1: "foo'bar",
  quote2: 'foo"bar',

  // spaces at the beginning or end
  space1: ' test',
  space2: 'test ',

  // test test test ...
  wrapped: 'test '.repeat(20).trim(),

  // multiline value
  multiline: 'foo\nbar\nbaz',

  // needs leading space indicator
  leading_space: '\n  test',

  // non-printables in value
  nonprintable1: 'foo\vbar',
  nonprintable2: 'foo\vbar ' + 'test '.repeat(20).trim(),
  nonprintable3: 'foo\vbar ' + 'foo\nbar\nbaz',

  // empty string
  empty: '',

  // bool compat
  yes: 'yes'
};


describe('should format strings with specified quoting type', function () {
  it('quotingType=\', forceQuotes=false', function () {
    const expected = `
simple_key: value
foo'bar"baz: 1
"foo\\vbar": 1
"foo\\nbar\\nbaz": 1
'0x1234': 1
ambiguous: '0x1234'
'''foo''': 1
ambiguous1: '''foo'''
'"foo"': 1
ambiguous2: '"foo"'
quote1: foo'bar
quote2: foo"bar
space1: ' test'
space2: 'test '
wrapped: >-
  test test test test test test test test test test test test test test test
  test test test test test
multiline: |-
  foo
  bar
  baz
leading_space: |2-

    test
nonprintable1: "foo\\vbar"
nonprintable2: "foo\\vbar test test test test test test test test test test test test test test test test test test test test"
nonprintable3: "foo\\vbar foo\\nbar\\nbaz"
empty: ''
'yes': 'yes'
`.replace(/^\n/, '');

    assert.strictEqual(yaml.dump(sample, { quotingType: "'", forceQuotes: false }), expected);
  });


  it('quotingType=\", forceQuotes=false', function () {
    const expected = `
simple_key: value
foo'bar"baz: 1
"foo\\vbar": 1
"foo\\nbar\\nbaz": 1
"0x1234": 1
ambiguous: "0x1234"
"'foo'": 1
ambiguous1: "'foo'"
"\\"foo\\"": 1
ambiguous2: "\\"foo\\""
quote1: foo'bar
quote2: foo"bar
space1: " test"
space2: "test "
wrapped: >-
  test test test test test test test test test test test test test test test
  test test test test test
multiline: |-
  foo
  bar
  baz
leading_space: |2-

    test
nonprintable1: "foo\\vbar"
nonprintable2: "foo\\vbar test test test test test test test test test test test test test test test test test test test test"
nonprintable3: "foo\\vbar foo\\nbar\\nbaz"
empty: ""
"yes": "yes"
`.replace(/^\n/, '');

    assert.strictEqual(yaml.dump(sample, { quotingType: '"', forceQuotes: false }), expected);
  });


  it('quotingType=\', forceQuotes=true', function () {
    const expected = `
simple_key: 'value'
foo'bar"baz: 1
"foo\\vbar": 1
"foo\\nbar\\nbaz": 1
'0x1234': 1
ambiguous: '0x1234'
'''foo''': 1
ambiguous1: '''foo'''
'"foo"': 1
ambiguous2: '"foo"'
quote1: 'foo''bar'
quote2: 'foo"bar'
space1: ' test'
space2: 'test '
wrapped: 'test test test test test test test test test test test test test test test test test test test test'
multiline: "foo\\nbar\\nbaz"
leading_space: "\\n  test"
nonprintable1: "foo\\vbar"
nonprintable2: "foo\\vbar test test test test test test test test test test test test test test test test test test test test"
nonprintable3: "foo\\vbar foo\\nbar\\nbaz"
empty: ''
'yes': 'yes'
`.replace(/^\n/, '');

    assert.strictEqual(yaml.dump(sample, { quotingType: "'", forceQuotes: true }), expected);
  });


  it('quotingType=\", forceQuotes=true', function () {
    const expected = `
simple_key: "value"
foo'bar"baz: 1
"foo\\vbar": 1
"foo\\nbar\\nbaz": 1
"0x1234": 1
ambiguous: "0x1234"
"'foo'": 1
ambiguous1: "'foo'"
"\\"foo\\"": 1
ambiguous2: "\\"foo\\""
quote1: "foo'bar"
quote2: "foo\\"bar"
space1: " test"
space2: "test "
wrapped: "test test test test test test test test test test test test test test test test test test test test"
multiline: "foo\\nbar\\nbaz"
leading_space: "\\n  test"
nonprintable1: "foo\\vbar"
nonprintable2: "foo\\vbar test test test test test test test test test test test test test test test test test test test test"
nonprintable3: "foo\\vbar foo\\nbar\\nbaz"
empty: ""
"yes": "yes"
`.replace(/^\n/, '');

    assert.strictEqual(yaml.dump(sample, { quotingType: '"', forceQuotes: true }), expected);
  });
});
