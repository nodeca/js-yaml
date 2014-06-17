'use strict';
/*global it, describe */


var assert = require('assert');
var common = require('../../lib/js-yaml/common');


describe('Utilities', function () {
  it('isNegativeZero', function () {
    assert(!common.isNegativeZero(0));
    assert(!common.isNegativeZero(0.0));
    assert(common.isNegativeZero(-0));
    assert(common.isNegativeZero(-0.0));
  });
});
