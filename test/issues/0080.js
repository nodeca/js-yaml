'use strict';


var assert = require('assert');
var yaml = require('../../');


test('Consider tabs indentation as invalid in mappings', function () {
  assert.throws(function () { yaml.load('mapping:\n\tkey: value'); });
});

test('Consider tabs indentation as invalid in block scalars', function () {
  assert.throws(function () { yaml.load('|\tblock scalar'); });
});

test('Allow tabs as white-space', function () {
  assert.doesNotThrow(function () { yaml.load('key:\tvalue'); });
});
