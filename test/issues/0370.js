'use strict';

var assert = require('assert');
var yaml = require('../../');

test('should quote keys when using qouteKeys', function () {
  var object = { a: { b: 'c' } };
  var objectDump = yaml.dump(object, { flowLevel: 0, indent: 0, quoteKeys: true });
  assert.equal(
    objectDump,
    '{"a": {"b": c}}\n'
  );
  assert.deepEqual(yaml.load(objectDump), object);
});

test('should correctly emit objects with condenseFlow and quoteKeys set to true', function () {
  var object = { a: { b: 'c' } };
  var objectDump = yaml.dump(object, { flowLevel: 0, indent: 0, condenseFlow: true, quoteKeys: true });
  assert.equal(
    objectDump,
    '{"a":{"b":c}}\n'
  );
  assert.deepEqual(yaml.load(objectDump), object);
});

test('should correctly emit objects with quoteKeys set to "', function () {
  var object = { a: { b: 'c' } };
  var objectDump = yaml.dump(object, { flowLevel: 0, indent: 0, quoteKeys: '"' });
  assert.equal(
    objectDump,
    '{"a": {"b": c}}\n'
  );
  assert.deepEqual(yaml.load(objectDump), object);
});

test('should correctly emit objects with quoteKeys set to \'', function () {
  var object = { a: { b: 'c' } };
  var objectDump = yaml.dump(object, { flowLevel: 0, indent: 0, quoteKeys: '\'' });
  assert.equal(
    objectDump,
    '{\'a\': {\'b\': c}}\n'
  );
  assert.deepEqual(yaml.load(objectDump), object);
});
