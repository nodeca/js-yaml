'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');

var _functional = require('../support/functional');
var TEST_SCHEMA = require('../support/schema');
var YAMLError   = require('../../lib/js-yaml/error');


_functional.generateTests({
  description: 'Test errors loading all documents from the string.',
  files: ['.loader-error'],
  test: function (errorFile) {
    assert.throws(
      function () {
        jsyaml.loadAll(
          errorFile.content,
          function () {},
          { name: errorFile.path,
            schema: TEST_SCHEMA,
            strict: true });
      },
      YAMLError,
      'In file "' + errorFile.path + '"');
  }
});

_functional.generateTests({
  description: 'Test errors loading single documents from the string.',
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
