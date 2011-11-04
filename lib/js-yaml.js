'use strict';


if (undefined === global.JSCLASS_PATH) {
  global.JSCLASS_PATH = require('path').resolve(__filename, '../../node_modules/jsclass/src');
  require(global.JSCLASS_PATH + '/loader');
}


var fs = require('fs'),
    __ = require('./js-yaml/core').import('loader'),
    exports = module.exports;


exports.scan = function scan(stream, callback, Loader) {
  var loader = new (Loader || __.SafeLoader)(stream);
  while (loader.checkToken()) {
    callback(loader.getToken());
  }
};


exports.compose = function compose(stream, Loader) {
  var loader = new (Loader || __.SafeLoader)(stream);
  return loader.getSingleNode();
};


var load = exports.load = function load(stream, Loader) {
  var loader = new (Loader || __.SafeLoader)(stream);
  return loader.getSingleData();
};


var loadAll = exports.loadAll = function loadAll(stream, callback, Loader) {
  var loader = new (Loader || __.SafeLoader)(stream);

  while (loader.checkData()) {
    callback(loader.getData());
  }
};


// Register extensions handler
(function () {
  var require_handler = function (module, filename) {
    var fd = fs.openSync(filename, 'r');
    
    // fill in documents
    module.exports = [];
    loadAll(fd, function (doc) { module.exports.push(doc); });

    fs.closeSync(fd);
  };

  require.extensions['.yml'] = require_handler;
  require.extensions['.yaml'] = require_handler;
}());


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
