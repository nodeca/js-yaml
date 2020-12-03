'use strict';


var assert = require('assert');
var yaml = require('../../');


it.skip('Block scalar chomping does not work on zero indent', function () {
  assert.throws(function () { yaml.load('|-\nfoo\nbar'); }, yaml.YAMLException);
  assert.deepStrictEqual(yaml.dump('foo\nbar'), '|-\n  foo\nbar');
});
