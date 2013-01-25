'use strict';


var common = require('../common');
var NIL    = common.NIL;
var Type   = require('../type');


function resolveYamlBinary(object, explicit) {
  try {
    return common.decodeBase64(object);
  } catch (error) {
    return NIL;
  }
}


module.exports = new Type('tag:yaml.org,2002:binary', resolveYamlBinary);
