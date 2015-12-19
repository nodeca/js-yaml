/*global test */
'use strict';

var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;
var YAMLException = require('../../lib/js-yaml/exception');


test('Parse should fail when duplicate keys detected', function () {
  assert.throws(function () {
    yaml.safeLoad(readFileSync(require('path').join(__dirname, '../samples-load-errors/duplicate-key.yml'), 'utf8'),
      { strictKeys: true });
  }, YAMLException, 'duplicate key detected: one');
});

test('Parse not fail when duplicate keys detected and json input is detected', function () {
  var content = '{"a": 1, "a": 2}';
  var parsed = '';
  assert.doesNotThrow(function () {
    parsed = yaml.safeLoad(content,
      { json: true });
  }, YAMLException);
  assert.deepEqual(parsed, { a: 2 });
});

test('Parse should not fail when duplicate keys detected and json flag is active', function () {
  var content = readFileSync(require('path').join(__dirname, '../samples-load-errors/duplicate-key.yml'), 'utf8');
  var parsed = '';
  assert.doesNotThrow(function () {
    parsed = yaml.safeLoad(content,
      { json: true });
  }, YAMLException);
  assert.deepEqual(parsed, { foo: 'baz' });
});

test('Parse should not fail duplicate-value-key when duplicate keys detected and json flag is active', function () {
  var content = readFileSync(require('path').join(__dirname, '../samples-load-errors/duplicate-value-key.yml'), 'utf8');
  var parsed = '';
  assert.doesNotThrow(function () {
    parsed = yaml.safeLoad(content,
      { json: true });
  }, YAMLException);
  assert.deepEqual(parsed, { foo: 'bar', '=': 2 });
});
