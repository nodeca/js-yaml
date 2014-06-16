'use strict';
/*global it */


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('Non-specific "!" tags should resolve to !!str', function () {
  var data = yaml.safeLoad(readFileSync(__dirname + '/data/issue-17.yml', 'utf8'));

  assert.equal(typeof data, 'string');
});
