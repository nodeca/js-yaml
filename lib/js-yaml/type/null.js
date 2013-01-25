'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var YAML_NULL_MAP = {
  '~'    : true,
  'null' : true,
  'Null' : true,
  'NULL' : true
};


function resolveYamlNull(object, explicit) {
  return (null === object || YAML_NULL_MAP[object]) ? null : NIL;
}


module.exports = new Type('tag:yaml.org,2002:null', resolveYamlNull);
