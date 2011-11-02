'use strict';


if (undefined === global.JSCLASS_PATH) {
  global.JSCLASS_PATH = require('path').resolve(__filename, '../../node_modules/jsclass/src');
  require(global.JSCLASS_PATH + '/loader');
}


var fs = require('fs'),
    __ = require('./js-yaml/core').import('loader');


module.exports.load = function load(stream) {
  var loader = new __.SafeLoader(stream);
  return loader.getSingleData();
};

var loadAll = module.exports.loadAll = function loadAll(stream) {
  var loader = new __.SafeLoader(stream), docs = [];

  while (loader.checkData()) {
    docs.push(loader.getData());
  }

  return docs;
};


// Register extensions handler
(function () {
  var require_handler = function (module, filename) {
    var fd = fs.openSync(filename, 'r');
    module.exports = loadAll(fd);
    fs.closeSync(fd);
  };

  require.extensions['.yml'] = require_handler;
  require.extensions['.yaml'] = require_handler;
}());


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
