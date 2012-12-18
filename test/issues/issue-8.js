'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(8, {
  title: 'Parse failed when no document start present',
  fixed: true,
  test: function (file) {
    assert.doesNotThrow(function () {
      jsyaml.load(file.content);
    }, TypeError);
  }
});
