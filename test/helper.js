var Vows = require('vows');
var Assert = require('assert');
var Path = require('path');
var Fs = require('fs');


var Helper = module.exports = {};


Helper.suite = function suite(name, dirname, regexp) {
  var suite = Vows.describe(name);

  Fs.readdirSync(dirname).forEach(function (filename) {
    var file = Path.join(dirname, filename);

    if (Fs.statSync(file).isFile() && regexp.test(filename)) {
      suite.addBatch(require(file));
    }
  });

  return suite;
};


Helper.issue = function issue(desc) {
  var batch = {};

  batch[desc.title] = function () {
    desc.test();
    if (!desc.fixed) {
      throw {message: "Test passed, but it shouldn't!"};
    }
  };

  return batch;
};
