'use strict';


var assert = require('assert');
var yaml   = require('../../');
var readFileSync = require('fs').readFileSync;


test('Should not allow nested arrays in map keys (explicit syntax)', function () {
  try {
    yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0475-case1.yml'), 'utf8'));
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: nested arrays are not supported inside keys'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});

test('Should not allow nested arrays in map keys (implicit syntax)', function () {
  try {
    yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0475-case2.yml'), 'utf8'));
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: nested arrays are not supported inside keys'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});
