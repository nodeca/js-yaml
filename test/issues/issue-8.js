'use strict';
/*global it */


var assert = require('assert');


it('Parse failed when no document start present', function () {
  assert.doesNotThrow(function () {
    require('./data/issue-8.yml');
  }, TypeError);
});
