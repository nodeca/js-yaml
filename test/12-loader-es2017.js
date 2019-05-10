'use strict';


var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var yaml   = require('..');
var semver = require('semver');

var TEST_SCHEMA = require('./support/schema').TEST_SCHEMA;


suite('Loader ES2017', function () {

  var samplesDir = path.resolve(__dirname, 'samples-es2017');

  fs.readdirSync(samplesDir).forEach(function (jsFile) {
    if (path.extname(jsFile) !== '.js') return; // continue

    var yamlFile = path.resolve(samplesDir, path.basename(jsFile, '.js') + '.yml');

    test(path.basename(jsFile, '.js'), function () {

      // skip test if we don't support ES2017
      if (semver.lt(process.version, '8.0.0')) return this.skip();

      var expected = require(path.resolve(samplesDir, jsFile));
      var actual   = [];

      yaml.loadAll(fs.readFileSync(yamlFile, { encoding: 'utf8' }), function (doc) { actual.push(doc); }, {
        filename: yamlFile,
        schema: TEST_SCHEMA
      });

      if (actual.length === 1) actual = actual[0];

      if (typeof expected === 'function') {
        expected.call(this, actual);
      } else {
        assert.deepEqual(actual, expected);
      }
    });
  });
});
