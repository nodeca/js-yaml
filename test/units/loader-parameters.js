'use strict';

var assert = require('assert');
var yaml = require('../..');

function createMergeChain(count) {
  var lines = [ 'a0: &a0 { k0: 0 }' ];
  var i;

  for (i = 1; i < count; i++) {
    lines.push('a' + i + ': &a' + i + ' { <<: *a' + (i - 1) + ', k' + i + ': ' + i + ' }');
  }

  lines.push('b: *a' + (count - 1));
  return lines.join('\n') + '\n';
}

suite('loader parameters', function () {
  var testStr = 'test: 1 \ntest: 2';
  var expected =  [ { test: 2 } ];
  var result;

  test('loadAll(input, options)', function () {
    result = yaml.loadAll(testStr, { json: true });
    assert.deepEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepEqual(result, expected);
  });

  test('loadAll(input, null, options)', function () {
    result = yaml.loadAll(testStr, null, { json: true });
    assert.deepEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepEqual(result, expected);
  });

  test('safeLoadAll(input, options)', function () {
    result = yaml.safeLoadAll(testStr, { json: true });
    assert.deepEqual(result, expected);

    result = [];
    yaml.safeLoadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepEqual(result, expected);
  });

  test('safeLoadAll(input, null, options)', function () {
    result = yaml.safeLoadAll(testStr, null, { json: true });
    assert.deepEqual(result, expected);

    result = [];
    yaml.safeLoadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepEqual(result, expected);
  });

  test('maxTotalMergeKeys - caps total merge keys', function () {
    function merge(n) {
      var anchors = [];
      var refs = [];
      var i;

      for (i = 0; i < n; i++) {
        anchors.push('- &x' + i + ' {a' + i + ': ' + i + '}');
        refs.push('*x' + i);
      }

      return anchors.join('\n') + '\n- <<: [' + refs.join(', ') + ']\n';
    }

    assert.doesNotThrow(function () {
      yaml.safeLoad(merge(3), { maxTotalMergeKeys: 5 });
    });
    assert.throws(function () {
      yaml.safeLoad(merge(3), { maxTotalMergeKeys: 2 });
    }, /maxTotalMergeKeys/);
    assert.doesNotThrow(function () {
      yaml.safeLoad(merge(3), { maxTotalMergeKeys: -1 });
    });

    result = yaml.safeLoad(createMergeChain(150), { maxTotalMergeKeys: -1 });
    assert.strictEqual(Object.keys(result.b).length, 150);
  });

  test('safeLoadAll - maxTotalMergeKeys is shared across all documents', function () {
    var src = [
      '---',
      'a: &a { k1: 1, k2: 2 }',
      'b: { <<: *a }',
      '---',
      'a: &a { k1: 1, k2: 2 }',
      'b: { <<: *a }',
      ''
    ].join('\n');

    assert.doesNotThrow(function () {
      yaml.safeLoadAll(src, { maxTotalMergeKeys: 4 });
    });
    assert.throws(function () {
      yaml.safeLoadAll(src, { maxTotalMergeKeys: 3 });
    }, /maxTotalMergeKeys/);
  });
});
