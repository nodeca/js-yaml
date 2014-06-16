'use strict';


var Type = require('../../type');


function validateJavascriptRegExp(data) {
  var regexp = data,
      tail   = /\/([gim]*)$/.exec(data),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  try {
    var dummy = new RegExp(regexp, modifiers);
    return true;
  } catch (error) {
    return false;
  }
}


function resolveJavascriptRegExp(data) {
  var regexp = data,
      tail   = /\/([gim]*)$/.exec(data),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  return new RegExp(regexp, modifiers);
}


function representJavascriptRegExp(object /*, style*/) {
  var result = '/' + object.source + '/';

  if (object.global) {
    result += 'g';
  }

  if (object.multiline) {
    result += 'm';
  }

  if (object.ignoreCase) {
    result += 'i';
  }

  return result;
}


function isRegExp(object) {
  return '[object RegExp]' === Object.prototype.toString.call(object);
}


module.exports = new Type('tag:yaml.org,2002:js/regexp', {
  loadKind: 'scalar',
  loadValidate: validateJavascriptRegExp,
  loadCreate: resolveJavascriptRegExp,
  dumpPredicate: isRegExp,
  dumpRepresent: representJavascriptRegExp
});
