'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');

var _functional = require('../support/functional');
var YAMLError = require('../../lib/js-yaml/errors').YAMLError;


_functional.generateTests({
  description: 'Test errors loading all documents from the string.',
  files: ['.loader-error'],
  handler: function (errorFile) {
    assert.throws(function () {
      jsyaml.loadAll(errorFile.data, function () {});
    }, YAMLError);
  }
});

_functional.generateTests({
  description: 'Test errors loading single documents from the string.',
  files: ['.single-loader-error'],
  handler: function (errorFile) {
    assert.throws(function () {
      jsyaml.load(errorFile.data);
    }, YAMLError);
  }
});
