'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(54, {
  title: "Incorrect utf-8 handling on require('file.yaml')",
  fixed: true,
  test: function (file) {
    var doc = jsyaml.load(file.content),
        expected = '',
        index;

    //
    // document is an array of 40 elements
    // each element is a string of 100 `у` (Russian letter) chars
    //
    for (index = 0; index <= 100; index += 1) {
      expected += 'у';
    }

    //
    // make sure none of the strings were corrupted.
    //
    for (index = 0; index < 40; index += 1) {
      assert.equal(doc[index], expected, ('Line ' + index + ' is corrupted'));
    }
  }
});
