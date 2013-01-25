'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;


function resolveYamlSet(object, explicit) {
  var key;

  if ('[object Object]' !== _toString.call(object)) {
    return NIL;
  }

  for (key in object) {
    if (_hasOwnProperty.call(object, key)) {
      if (null !== object[key]) {
        return NIL;
      }
    }
  }

  return object;
}


module.exports = new Type('tag:yaml.org,2002:set', resolveYamlSet);
