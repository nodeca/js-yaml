'use strict';
/*global it:false */


var assert = require('assert');

require('../../lib/js-yaml');


it('#26: should convert new line into white space', function () {
  var data = require('./data/issue-26.yml');

  assert.equal(data.test, 'a b c\n');
});
