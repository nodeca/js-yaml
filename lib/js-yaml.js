'use strict';


var loader = require('./js-yaml/loader');


function deprecated(name) {
  return function () {
    throw new Error('Function ' + name + ' is deprecated and cannot be used.');
  };
}


module.exports.Schema         = require('./js-yaml/schema');
module.exports.CORE_SCHEMA    = require('./js-yaml/schema/core');
module.exports.DEFAULT_SCHEMA = require('./js-yaml/schema/default');
module.exports.Type           = require('./js-yaml/type');
module.exports.load           = loader.load;
module.exports.loadAll        = loader.loadAll;
module.exports.safeLoad       = loader.safeLoad;
module.exports.safeLoadAll    = loader.safeLoadAll;
module.exports.scan           = deprecated('scan');
module.exports.parse          = deprecated('parse');
module.exports.compose        = deprecated('compose');
module.exports.addConstructor = deprecated('addConstructor');


require('./js-yaml/require');
