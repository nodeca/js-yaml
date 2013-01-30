'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


function resolveYamlSequence(object, explicit) {
  return Array.isArray(object) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:seq', resolveYamlSequence);
