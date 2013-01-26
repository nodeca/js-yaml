'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');

var _functional = require('../support/functional');
var YAMLError = require('../../lib/js-yaml/error');


_functional.generateTests({
  description: 'Test errors loading all documents from the string.',
  files: ['.loader-error'],
  test: function (errorFile) {
    assert.throws(
      function () {
        jsyaml.loadAll(
          errorFile.content,
          function () {},
          { name: errorFile.path });
      },
      YAMLError);
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
          { name: errorFile.path });
      },
      YAMLError);
  }
});
