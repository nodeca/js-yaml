'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('Infinite loop when attempting to parse multi-line scalar document that is not indented', function () {
  assert.strictEqual(yaml.load('--- |\nfoo\n'), 'foo\n');
});
