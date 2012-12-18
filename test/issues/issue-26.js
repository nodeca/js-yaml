'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(26, {
  title: 'should convert new line into white space',
  fixed: true,
  test: function (file) {
    var doc = jsyaml.load(file.content);

    assert.equal(doc.test, 'a b c\n');
  }
});
