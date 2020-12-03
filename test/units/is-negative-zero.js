'use strict';


var assert = require('assert');

var isNegativeZero = require('../../lib/common').isNegativeZero;


test('isNegativeZero', function () {
  assert(!isNegativeZero(0));
  assert(!isNegativeZero(0.0));
  assert(isNegativeZero(-0));
  assert(isNegativeZero(-0.0));
});
