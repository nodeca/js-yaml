'use strict';

var assert = require('assert');
var yaml = require('../../');

suite('parameters', function () {
  var testStr = 'test: 1 \ntest: 2';
  var expected =  [ { test: 2 } ];
  var result;
  test('loadAll', function () {
    result = yaml.loadAll(testStr, { json: true });
    assert.deepEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepEqual(result, expected);
  });

  test('safeLoadAll', function () {
    result = yaml.safeLoadAll(testStr, { json: true });
    assert.deepEqual(result, expected);

    result = [];
    yaml.safeLoadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepEqual(result, expected);
  });
});
