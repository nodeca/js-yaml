'use strict';


var Type = require('../../type');


function resolveJavascriptRegExp(state /*, explicit*/) {
  var regexp = state.result,
      tail   = /\/([gim]*)$/.exec(state.result),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  try {
    state.result =  new RegExp(regexp, modifiers);
    return true;
  } catch (error) {
    return false;
  }
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


module.exports = new Type('tag:yaml.org,2002:js/regexp', {
  loader: {
    kind: 'string',
    resolver: resolveJavascriptRegExp
  },
  dumper: {
    kind: 'object',
    instanceOf: RegExp,
    representer: representJavascriptRegExp
  }
});
