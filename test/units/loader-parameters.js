'use strict';

var assert = require('assert');
var yaml = require('../..');

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
});

// Builds a YAML string with a merge sequence of `count` anchored mappings
function buildMergeSeqYaml(count) {
  var repeated = '*a, '.repeat(count);

  return [
    'a: &a { k: 0 }',
    'b: { <<: [ ' + repeated + '*a ] }'
  ].join('\n');
}

suite('maxMergeSeqLength option', function () {
  test('merge sequence within default limit (20) should succeed', function () {
    var input = buildMergeSeqYaml(19);
    assert.doesNotThrow(function () {
      yaml.safeLoad(input);
    });
  });

  test('merge sequence exceeding default limit (20) should throw', function () {
    var input = buildMergeSeqYaml(20);
    assert.throws(function () {
      yaml.safeLoad(input);
    }, /merge sequence length exceeded maxMergeSeqLength \(20\)/);
  });

  test('custom maxMergeSeqLength allows longer sequences', function () {
    var input = buildMergeSeqYaml(29);
    assert.doesNotThrow(function () {
      yaml.safeLoad(input, { maxMergeSeqLength: 30 });
    });
  });

  test('custom maxMergeSeqLength rejects sequences that exceed it', function () {
    var input = buildMergeSeqYaml(4);
    assert.throws(function () {
      yaml.safeLoad(input, { maxMergeSeqLength: 4 });
    }, /merge sequence length exceeded maxMergeSeqLength \(4\)/);
  });

  test('merge sequence within custom limit should succeed', function () {
    var input = buildMergeSeqYaml(3);
    assert.doesNotThrow(function () {
      yaml.safeLoad(input, { maxMergeSeqLength: 4 });
    });
  });
});
