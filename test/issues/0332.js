'use strict';


const assert = require('assert');
const yaml   = require('../../');


it('Should format errors', function () {
  try {
    yaml.load('"foo\u0001bar"');
  } catch (err) {
    assert.strictEqual(err.toString(true), 'YAMLException: expected valid JSON character (1:9)');
    assert.strictEqual(err.toString(false), `YAMLException: expected valid JSON character (1:9)

 1 | "foo\u0001bar"
-------------^`);
  }

  try {
    yaml.load('*');
  } catch (err) {
    assert.strictEqual(err.toString(), `YAMLException: name of an alias node must contain at least one character (1:2)

 1 | *
------^`);
  }

  try {
    yaml.load('foo:\n  bar: 1\na');
  } catch (err) {
    // eslint-disable-next-line max-len
    assert.strictEqual(err.toString(), `YAMLException: can not read a block mapping entry; a multiline key may not be an implicit key (4:1)

 1 | foo:
 2 |   bar: 1
 3 | a
 4 | 
-----^`);
  }
});
