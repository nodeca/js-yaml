'use strict';
/*global it */


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('Parse failed when no document start present', function () {
  assert.doesNotThrow(function () {
    yaml.safeLoad(readFileSync(__dirname + '/data/issue-8.yml', 'utf8'));
  }, TypeError);
});
