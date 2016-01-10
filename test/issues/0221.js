'use strict';


var assert = require('assert');
var yaml = require('../../');


test.skip('Block scalar chomping does not work on zero indent', function () {
  assert.throws(function () { yaml.load('|-\nfoo\nbar'); }, yaml.YAMLException);
  assert.deepEqual(yaml.dump('foo\nbar'), '|-\n  foo\nbar');
});
