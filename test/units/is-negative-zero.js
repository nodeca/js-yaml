'use strict';
/*global it */


var assert = require('assert');

var isNegativeZero = require('../../lib/js-yaml/common').isNegativeZero;


it('isNegativeZero', function () {
  assert(!isNegativeZero(0));
  assert(!isNegativeZero(0.0));
  assert(isNegativeZero(-0));
  assert(isNegativeZero(-0.0));
});
