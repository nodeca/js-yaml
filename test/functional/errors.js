'use strict';


var assert = require('assert');
var fs = require('fs');
var jsyaml = require('../../lib/js-yaml');
var YAMLError = require('../../lib/js-yaml/errors').YAMLError;
var functional = require('../../lib/js-yaml-test/functional');


functional.generateTests({
  description: 'Test errors loading all documents from file resource.',
  files: ['.loader-error'],
  handler: function (errorFile) {
    assert.throws(function () {
      var fd = fs.openSync(errorFile.path, 'r');
      jsyaml.loadAll(fd, function () {});
      fs.closeSync(fd);
    }, YAMLError);
  }
});

functional.generateTests({
  description: 'Test errors loading all documents from the string.',
  files: ['.loader-error'],
  handler: function (errorFile) {
    assert.throws(function () {
      jsyaml.loadAll(errorFile.data, function () {});
    }, YAMLError);
  }
});

functional.generateTests({
  description: 'Test errors loading single documents from the string.',
  files: ['.single-loader-error'],
  handler: function (errorFile) {
    assert.throws(function () {
      jsyaml.load(errorFile.data);
    }, YAMLError);
  }
});
