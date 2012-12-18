'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(33, {
  title: 'refactor compact variant of MarkedYAMLError.toString',
  fixed: true,
  test: function (file) {
    try {
      jsyaml.load(file.content);
    } catch (err) {
      assert.equal(
        err.toString(true),
        'Error on line 1, col 12: expected <block end>, but found undefined'
      );
      return;
    }

    throw new Error('jsyaml.load should throw but it does not');
  }
});
