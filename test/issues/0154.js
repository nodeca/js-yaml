'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('Indentation warning on empty lines within quoted scalars', function () {
  assert.doesNotThrow(function () { yaml.load("- 'hello\n\n  world'"); });
  assert.doesNotThrow(function () { yaml.load('- "hello\n\n  world"'); });
  assert.doesNotThrow(function () { yaml.load('- [hello,\n\n  world]'); });
  assert.doesNotThrow(function () { yaml.load('- {hello: world,\n\n  foo: bar}'); });
});
