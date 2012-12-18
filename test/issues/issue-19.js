'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(19, {
  title: 'Timestamp parsing is one month off',
  fixed: true,
  test: function (file) {
    var doc = jsyaml.load(file.content);

    // JS month starts with 0 (0 => Jan, 1 => Feb, ...)
    assert.equal(doc.xmas.getTime(), Date.UTC(2011, 11, 24));
  }
});
