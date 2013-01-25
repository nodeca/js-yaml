'use strict';


var Type = require('../../type');


function resolveJavascriptUndefined(object, explicit) {
  var undef;

  return undef;
}


module.exports = new Type('tag:yaml.org,2002:js/undefined', resolveJavascriptUndefined);
