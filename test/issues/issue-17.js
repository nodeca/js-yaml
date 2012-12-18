'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(17, {
  title: 'Non-specific "!" tags should resolve to !!str',
  fixed: true,
  test: function (file) {
    var doc = jsyaml.load(file.content);

    assert.equal(typeof doc, 'string');
  }
});
