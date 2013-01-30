'use strict';


var assert = require('assert');
var path = require('path');
var fs = require('fs');
var $$ = require('../../lib/js-yaml/common');
var NIL = $$.NIL;


var _hasOwnProperty = Object.prototype.hasOwnProperty;


var _common = module.exports = {};
$$.extend(_common, $$);


function toArray(sequence) {
  if (Array.isArray(sequence)) {
    return sequence;
  } else if ($$.isNothing(sequence)) {
    return [];
  } else {
    return [ sequence ];
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

  return function fromYAMLNode(object, explicit) {
    if (!$$.isObject(object)) {
      return NIL;
    }

    $$.each(mapKeys, function (newKey, oldKey) {
      if (_hasOwnProperty.call(object, oldKey)) {
        object[newKey] = object[oldKey];
        delete object[oldKey];
      }
    });

    requiredKeys.forEach(function (key) {
      if (!_hasOwnProperty.call(object, key)) {
        return NIL;
      }
    });

    $$.each(object, function (value, key) {
      var hasAsRequired = (0 <= requiredKeys.indexOf(key)),
          hasAsOptional = (0 <= optionalKeys.indexOf(key));

      if (!hasAsRequired && !hasAsOptional) {
        return NIL;
      }
    });

    return new Class(object);
  };
}


_common.toArray = toArray;
_common.DataFile = DataFile;
_common.makeClassConstructor = makeClassConstructor;
