'use strict';
/*global it */


var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


it('Preserve sign for negative zeroes', function () {
  assert(1 / yaml.load('!!int -0') < 0);
  assert(1 / yaml.load('!!float -0.0') < 0);
});
