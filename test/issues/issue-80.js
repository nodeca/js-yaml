'use strict';


/*global it */


require('../../lib/js-yaml');


var assert = require('assert');


it('should consider tabs indentation as invalid', function () {
  assert.throws(
    function () { require('./data/issue-80.yml'); },
    "require('issue-80.yml') should throw, but it does not");
});
