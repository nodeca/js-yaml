'use strict';

var assert = require('assert');
var yaml = require('../..');

describe('loader parameters', function () {
  var testStr = 'test: 1 \ntest: 2';
  var expected =  [ { test: 2 } ];
  var result;

  it('loadAll(input, options)', function () {
    result = yaml.loadAll(testStr, { json: true });
    assert.deepStrictEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepStrictEqual(result, expected);
  });

  it('loadAll(input, null, options)', function () {
    result = yaml.loadAll(testStr, null, { json: true });
    assert.deepStrictEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepStrictEqual(result, expected);
  });

  it('loadAll(input, options)', function () {
    result = yaml.loadAll(testStr, { json: true });
    assert.deepStrictEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepStrictEqual(result, expected);
  });

  it('loadAll(input, null, options)', function () {
    result = yaml.loadAll(testStr, null, { json: true });
    assert.deepStrictEqual(result, expected);

    result = [];
    yaml.loadAll(testStr, function (doc) {
      result.push(doc);
    }, { json: true });
    assert.deepStrictEqual(result, expected);
  });
});
