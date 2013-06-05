'use strict';
/*global it */


var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var yaml   = require('../../lib/js-yaml');


var badThings = [];


global.makeBadThing = function (thing) {
  badThings.push(thing);
};


it('Function constructor must not allow to execute any code while parsing.', function () {
  var filename = path.join(__dirname, 'data', 'issue-parse-function-security.yml'),
      contents = fs.readFileSync(filename, 'utf8');

  assert.throws(function () { yaml.load(contents); }, yaml.YAMLException);
  assert.deepEqual(badThings, []);
});
