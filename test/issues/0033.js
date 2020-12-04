'use strict';


var assert = require('assert');
var yaml = require('../../');


it('refactor compact variant of MarkedYAMLError.toString', function () {
  var source = `
foo: {bar} baz
`;

  assert.throws(function () {
    yaml.load(source);
  }, "require('issue-33.yml') should throw, but it does not");
});
