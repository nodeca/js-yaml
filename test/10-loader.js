'use strict';


var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var yaml   = require('../');

var TEST_SCHEMA = require('./support/schema').TEST_SCHEMA;


describe('Loader', function () {
  var samplesDir = path.resolve(__dirname, 'samples-common');

  fs.readdirSync(samplesDir).forEach(function (jsFile) {
    if (path.extname(jsFile) !== '.js') return; // continue

    var yamlFile = path.resolve(samplesDir, path.basename(jsFile, '.js') + '.yml');

    it(path.basename(jsFile, '.js'), function () {
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
        assert.deepStrictEqual(actual, expected);
      }
    });
  });
});


describe('loadMultiYaml', function () {
  var samplesDir = path.resolve(__dirname, 'samples-common');
  var yamlFile = path.resolve(samplesDir, 'construct-multi-yaml.yml'); // Updated to specific file

  it('should load multi-document YAML', function () { // Updated description
    var expected = [
      {
        name: 'Example Document 1',
        items: [
          { part: 'A', quantity: 10 },
          { part: 'B', quantity: 5 }
        ]
      },
      {
        name: 'Example Document 2',
        info: {
          description: 'This is a test document',
          version: 2
        },
        values: [
          { type: 'alpha' },
          { type: 'beta' },
          { type: 'gamma' }
        ]
      },
      {
        name: 'Example Document 3',
        settings: {
          enabled: true,
          threshold: 0.75
        }
      }
    ];

    var stream = fs.readFileSync(yamlFile, { encoding: 'utf8' });
    var actual = yaml.loadMultiYaml(stream, {
      schema: TEST_SCHEMA
    });

    if (actual.length === 1) actual = actual[0];

    if (typeof expected === 'function') {
      expected.call(this, actual);
    } else {
      assert.deepStrictEqual(actual, expected);
    }
  });
});
