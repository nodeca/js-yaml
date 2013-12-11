'use strict';


var path   = require('path');
var fs     = require('fs');
var common = require('../../lib/js-yaml/common');


var _hasOwnProperty = Object.prototype.hasOwnProperty;


function each(obj, iterator, context) {
  var keys, i, l;

  if (null === obj || undefined === obj) {
    return;
  }

  context = context || iterator;

  if (obj.forEach === Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else {
    keys = Object.getOwnPropertyNames(obj);
    for (i = 0, l = keys.length; i < l; i += 1) {
      iterator.call(context, obj[keys[i]], keys[i], obj);
    }
  }
}


function DataFile(filepath) {
  this.path = path.normalize(filepath);
  this.encoding = 'utf8';
  this.content = DataFile.read(this);
}


DataFile.read = function read(dataFile) {
  if ('.js' === path.extname(dataFile.path)) {
    return require(dataFile.path);
  } else {
    return fs.readFileSync(dataFile.path, dataFile.encoding);
  }
};


function makeClassConstructor(Class, params) {
  var mapKeys      = params.map      || {},
      requiredKeys = params.required || [],
      optionalKeys = params.optional || [];

  return function fromYAMLNode(state /*, explicit*/) {
    var object = state.result;

    if (!common.isObject(object)) {
      return false;
    }

    each(mapKeys, function (newKey, oldKey) {
      if (_hasOwnProperty.call(object, oldKey)) {
        object[newKey] = object[oldKey];
        delete object[oldKey];
      }
    });

    requiredKeys.forEach(function (key) {
      if (!_hasOwnProperty.call(object, key)) {
        return false;
      }
    });

    each(object, function (value, key) {
      var hasAsRequired = (0 <= requiredKeys.indexOf(key)),
          hasAsOptional = (0 <= optionalKeys.indexOf(key));

      if (!hasAsRequired && !hasAsOptional) {
        return false;
      }
    });

    state.result = new Class(object);
    return true;
  };
}


module.exports = {};

common.extend(module.exports, common);

common.extend(module.exports, {
  each:                 each,
  DataFile:             DataFile,
  makeClassConstructor: makeClassConstructor
});
