'use strict';


var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var yaml   = require('..');
var semver = require('semver');

var TEST_SCHEMA = require('./support/schema').TEST_SCHEMA;


suite('Dumper ES2017', function () {

  var samplesDir = path.resolve(__dirname, 'samples-es2017');

  fs.readdirSync(samplesDir).forEach(function (jsFile) {
    if (path.extname(jsFile) !== '.js') return; // continue

    test(path.basename(jsFile, '.js'), function () {

      // skip test if we don't support ES2017
      if (semver.lt(process.version, '8.0.0')) return this.skip();

      var sample       = require(path.resolve(samplesDir, jsFile));
      var data         = typeof sample === 'function' ? sample.expected : sample,
          serialized   = yaml.dump(data,       { schema: TEST_SCHEMA }),
          deserialized = yaml.load(serialized, { schema: TEST_SCHEMA });

      if (typeof sample === 'function') {
        sample.call(this, deserialized);
      } else {
        assert.deepEqual(deserialized, sample);
      }
    });
  });
});
