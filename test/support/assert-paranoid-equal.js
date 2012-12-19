'use strict';


var assert = require('assert');
var inspectors = require('./assert-paranoid-equal/inspectors');
var Context = require('./assert-paranoid-equal/context');


function paranoidEqual(value1, value2) {
  inspectors.ensureEqual(new Context(value1, value2), value1, value2);
}


function notParanoidEqual(value1, value2) {
  assert.throws(
    function () { paranoidEqual(value1, value2); },
    assert.AssertionError,
    'Given objects are equal, witch is not expected.');
}


module.exports.paranoidEqual    = paranoidEqual;
module.exports.notParanoidEqual = notParanoidEqual;
