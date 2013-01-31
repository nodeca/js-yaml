'use strict';


var path   = require('path');
var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var helper = require('../support/helper');

var TEST_SCHEMA = require('../support/schema');
var YAMLError   = require('../../lib/js-yaml/error');


helper.generateTests({
  description: 'Errors on loading a single document.',
  directory: path.join(__dirname, 'single-errors'),
  files: ['.single-loader-error'],
  test: function (errorFile) {
    assert.throws(
      function () {
        jsyaml.load(
          errorFile.content,
          { name: errorFile.path,
            schema: TEST_SCHEMA,
            strict: true });
      },
      YAMLError,
      'In file "' + errorFile.path + '"');
  }
});
