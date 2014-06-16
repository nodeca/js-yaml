'use strict';
/*global it */


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('refactor compact variant of MarkedYAMLError.toString', function () {
  assert.throws(
    function () { yaml.safeLoad(readFileSync(__dirname + '/data/issue-33.yml', 'utf8')); },
    "require('issue-33.yml') should throw, but it does not");
});
