'use strict';


var Type = require('../../type');


function validateJavascriptUndefined() {
  return true;
}

function resolveJavascriptUndefined() {
  return undefined;
}


function representJavascriptUndefined(/*object, explicit*/) {
  return '';
}


function isUndefined(object) {
  return 'undefined' === typeof object;
}


module.exports = new Type('tag:yaml.org,2002:js/undefined', {
  loadKind: 'scalar',
  loadValidator: validateJavascriptUndefined,
  loadResolver: resolveJavascriptUndefined,
  dumpPredicate: isUndefined,
  dumpRepresenter: representJavascriptUndefined
});
