'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('Should throw if there is a null-byte in input', function () {
  try {
    yaml.safeLoad('foo\0bar');
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: null byte is not allowed in input'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});
