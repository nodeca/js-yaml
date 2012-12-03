'use strict'


var $$  = require('../../lib/js-yaml/common');
var path = require('path');
var fs = require('fs');

var DATA_DIRECTORY = process.env['JSYAML_TEST_DATA']
  ? path.normalize(process.env['JSYAML_TEST_DATA'])
  : path.join(__dirname, '../../test/functional/data');


function listDirectory(directory, callback) {
  callback(fs.readdirSync(directory));
}


function readFile(file, callback) {
  callback(fs.readFileSync(file, 'utf8'));
}


function collectDataFiles(directory, callback, context) {
  listDirectory(directory, function (files) {
    var collection = {};

    files.forEach(function (filename) {
      var extname = path.extname(filename),
          basename = path.basename(filename, extname);

      if (!collection.hasOwnProperty(basename)) {
        collection[basename] = [];
      }

      collection[basename].push(extname);
    });

    callback.call(context, collection);
  });
}


function selectDataFiles(collection, extnameList) {
  var basenameList = [];

  $$.each(collection, function (availableExts, basename) {
    function hasExt(extension) {
      return 0 <= availableExts.indexOf(extension);
    }

    if (extnameList.every(hasExt)) {
      basenameList.push(basename);
    }
  });

  return basenameList;
}


function readDataFiles(directory, basenameList, extnameList, callback, context) {
  basenameList.forEach(function (basename) {
    var amount = extnameList.length,
        counter = 0,
        loadedFiles = new Array(amount);

    extnameList.forEach(function (extname, extindex) {
      var filename = basename + extname,
          filepath = path.join(directory, filename);

      readFile(filepath, function (filedata) {
        loadedFiles[extindex] = {
          name: filename,
          path: filepath,
          data: filedata
        };

        counter += 1;

        if (counter == amount) {
          // Done.
          callback.call(context, basename, loadedFiles);
        }
      });
    });
  });
}

function loadDataFiles(directory, extnameList, callback, context) {
  collectDataFiles(directory, function (collection) {
    var basenameList = selectDataFiles(collection, extnameList);

    readDataFiles(directory, basenameList, extnameList, callback, context);
  });
}

function generateTests(settings) {
  var description = settings.description,
      async       = settings.async,
      handler     = settings.handler,
      directory   = settings.directory,
      extnameList = settings.files;

  if (null == async) {
    async = false;
  }
  if (null == directory) {
    directory = DATA_DIRECTORY;
  }

  describe(description, function () {
    loadDataFiles(directory, extnameList, function (basename, loadedFiles) {
      if (async) {
        it(basename, function (done) {
          handler.apply(this, [ done ].concat(loadedFiles));
        });
      } else {
        it(basename, function () {
          handler.apply(this, loadedFiles);
        });
      }
    });
  });
}


module.exports.DATA_DIRECTORY   = DATA_DIRECTORY;
module.exports.collectDataFiles = collectDataFiles;
module.exports.selectDataFiles  = selectDataFiles;
module.exports.readDataFiles    = readDataFiles;
module.exports.loadDataFiles    = loadDataFiles;
module.exports.generateTests    = generateTests;
