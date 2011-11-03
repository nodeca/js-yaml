var suite = module.exports = [],
    fs = require('fs'),
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    helper = require(__dirname + '/../test-helper'),
    $$ = require(__dirname + '/../../lib/js-yaml/core'),
    __ = $$.import('error');


suite.push({
  unittest: ['.loader-error'],
  execute: function test_loader_error(error_filename) {
    assert.throws(function () {
      var fd = fs.openSync(error_filename, 'r');
      jsyaml.loadAll(fd, function (doc) {});
      fs.closeSync(fd);
    }, __.YAMLError);
  }
});


suite.push({
  unittest: ['.loader-error'],
  execute: function test_loader_error_string(error_filename) {
    assert.throws(function () {
      var str = fs.readFileSync(error_filename, 'utf8');
      jsyaml.loadAll(str, function (doc) {});
    }, __.YAMLError);
  }
});


suite.push({
  unittest: ['.single-loader-error'],
  execute: function test_loader_error_single(error_filename) {
    assert.throws(function () {
      jsyaml.load(fs.readFileSync(error_filename, 'utf8'));
    }, __.YAMLError);
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
