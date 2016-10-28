'use strict';

var assert = require('assert');
var yaml   = require('../../');

test('Loader should not strip quotes before newlines', function () {
  var with_space = yaml.load("'''foo'' '");
  var with_newline = yaml.load("'''foo''\n'");
  assert.strictEqual(with_space, "'foo' ");
  assert.strictEqual(with_newline, "'foo' ");
});
