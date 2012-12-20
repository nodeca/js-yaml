'use strict';
/*global describe, it */


var path = require('path');
var fs = require('fs');
var _common = require('./common');


var DATA_DIRECTORY = process.env['JSYAML_FUNCTIONAL_TEST_DATA'] ?
  path.normalize(process.env['JSYAML_FUNCTIONAL_TEST_DATA']) :
  path.join(__dirname, '../functional/data');


function collectDataFiles(directory) {
  var files = fs.readdirSync(directory),
      collection = {};

  files.forEach(function (filename) {
    var extname = path.extname(filename),
        basename = path.basename(filename, extname);

    if (!collection.hasOwnProperty(basename)) {
      collection[basename] = [];
    }

    collection[basename].push(extname);
  });

  return collection;
}


function generateTests(settings) {
  var description = settings.description,
      directory   = settings.directory || DATA_DIRECTORY,
      files       = _common.toArray(settings.files),
      skip        = _common.toArray(settings.skip),
      testHandler = settings.test;

  describe(description, function () {
    var availableFiles = collectDataFiles(directory);

    _common.each(availableFiles, function (extnames, basename) {

      function shouldSkipFile() {
        return extnames.some(function (ext) {
          return 0 <= skip.indexOf(ext);
        });
      }

      function shouldTakeFile() {
        return files.every(function (ext) {
          return !shouldSkipFile() && (0 <= extnames.indexOf(ext));
        });
      }

      function takeFile(ext) {
        return new _common.DataFile(path.join(directory, (basename + ext)));
      }

      if (shouldTakeFile()) {
        it(basename, function () {
          testHandler.apply(this, files.map(takeFile));
        });
      }
    });
  });
}


module.exports.DATA_DIRECTORY   = DATA_DIRECTORY;
module.exports.collectDataFiles = collectDataFiles;
module.exports.generateTests    = generateTests;
