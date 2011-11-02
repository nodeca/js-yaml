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


var require_handler = function (module, filename) {
  module.exports = loadAll(fs.openSync(filename, 'r'));
};


module.exports.registerExtensions = function registerExtensions(extensions) {
  if (!Array.isArray(extensions) || !extensions.length) {
    extensions = ['yml', 'yaml'];
  }

  extensions.forEach(function (ext) {
    require.extensions['.' + ext] = require_handler;
  });
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
