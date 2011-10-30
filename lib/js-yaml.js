'use strict';


if (undefined === global.JSCLASS_PATH) {
  global.JSCLASS_PATH = require('path').resolve(__filename, '../../node_modules/jsclass/src');
  require(global.JSCLASS_PATH + '/loader');
}

var __ = require('./js-yaml/core').import('loader');

exports.load = function load(stream) {
  var loader = new __.SafeLoader(stream);
  return loader.getSingleData();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
