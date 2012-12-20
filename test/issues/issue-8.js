'use strict';
/*global it */


var assert = require('assert');

require('../../lib/js-yaml');


it('#8: Parse failed when no document start present', function () {
  assert.doesNotThrow(function () {
    require('./data/issue-8.yml');
  }, TypeError);
});
