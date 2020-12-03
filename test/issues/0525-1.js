'use strict';


var assert = require('assert');
var yaml   = require('../../');


it('Should throw if there is a null-byte in input', function () {
  try {
    yaml.load('foo\0bar');
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: null byte is not allowed in input'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});
