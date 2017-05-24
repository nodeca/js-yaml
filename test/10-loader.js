'use strict';


var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var yaml   = require('../');

var TEST_SCHEMA = require('./support/schema').TEST_SCHEMA;


suite('Loader', function () {
  var samplesDir = path.resolve(__dirname, 'samples-common');

  fs.readdirSync(samplesDir).forEach(function (jsFile) {
    if (path.extname(jsFile) !== '.js') return; // continue

    var yamlFile = path.resolve(samplesDir, path.basename(jsFile, '.js') + '.yml');

    test(path.basename(jsFile, '.js'), function () {
      var expected = require(path.resolve(samplesDir, jsFile));
      var actual   = [];

      var returned = yaml.loadAll(fs.readFileSync(yamlFile, { encoding: 'utf8' }), function (doc) {
        actual.push(doc);
      }, {
        filename: yamlFile,
        schema: TEST_SCHEMA
      });

      if (actual.length === 1) actual = actual[0];
      if (returned.length === 1) returned = returned[0];

      if (typeof expected === 'function') {
        expected.call(this, actual);
      } else {
        assert.deepEqual(actual, expected);
        assert.deepEqual(returned, expected);
      }
    });
  });
});
