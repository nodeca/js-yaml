'use strict';
/*global it:false */


var assert = require('assert');

require('../../lib/js-yaml');


it('#33: refactor compact variant of MarkedYAMLError.toString', function () {
  try {
    require('./data/issue-33.yml');
  } catch (err) {
    assert.equal(
      err.toString(true),
      'Error on line 1, col 12: expected <block end>, but found undefined');
    return;
  }

  throw new Error("require('issue-33.yml') should throw, but it does not");
});
