'use strict';
/*global it */


var assert = require('assert');


var badThings = [];


global.makeBadThing = function (thing) {
  badThings.push(thing);
};


it('Function constructor must not allow to execute any code while parsing.', function () {
  assert.throws(function () {
    require('./data/issue-parse-function-security.yml');
  });

  assert.deepEqual(badThings, []);
});
