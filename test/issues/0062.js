'use strict';

var assert = require('assert');
var yaml = require('../../');


test('Reading of properties on implicit block mapping keys (map tag on the same line with key)', function () {
  assert.doesNotThrow(function () { yaml.load('block mapping: !!map\n  !!str implicit key: some value'); });
});

test('Reading of properties on implicit block mapping keys (map tag on a new line)', function () {
  assert.doesNotThrow(function () { yaml.load('block mapping:\n  !!map\n  !!str implicit key: some value'); });
});

test('Reading top-level mapping with explicit type tag for key', function () {
  assert.doesNotThrow(function () { yaml.load('!!int 16: 32'); });
});

test('Reading block mapping with explicit type tag for key', function () {
  assert.doesNotThrow(function () { yaml.load('block mapping:\n  !!int 16: 32'); });
});

