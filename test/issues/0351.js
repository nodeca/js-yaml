'use strict';


var assert = require('assert');
var yaml = require('../..');
var readFileSync = require('fs').readFileSync;


test('should include the error message in the error stack', function () {
  try {
    yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0351.yml'), 'utf8'));
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: end of the stream or a document separator is expected'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});
