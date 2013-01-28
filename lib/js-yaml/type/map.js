'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _toString = Object.prototype.toString;


function resolveYamlMapping(object, explicit) {
  return ('[object Object]' === _toString.call(object)) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:map', resolveYamlMapping);
