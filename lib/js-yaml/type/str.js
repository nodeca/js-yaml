'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


function resolveYamlString(object, explicit) {
  return ('string' === typeof object) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:str', resolveYamlString);
