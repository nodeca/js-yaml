'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _toString = Object.prototype.toString;


function resolveYamlSequence(object, explicit) {
  return ('[object Array]' === _toString.call(object)) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:seq', resolveYamlSequence);
