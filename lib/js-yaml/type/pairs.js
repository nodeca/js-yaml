'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _toString = Object.prototype.toString;


function resolveYamlPairs(object, explicit) {
  var index, length, pair;

  if ('[object Array]' !== _toString.call(object)) {
    return NIL;
  }

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if ('[object Object]' !== _toString.call(pair)) {
      return NIL;
    }

    if (1 !== Object.keys(pair).length) {
      return NIL;
    }
  }

  return object;
}


module.exports = new Type('tag:yaml.org,2002:pairs', resolveYamlPairs);
