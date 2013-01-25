'use strict';


var NIL  = require('../../common').NIL;
var Type = require('../../type');


function resolveJavascriptRegExp(object, explicit) {
  var regexp = object,
      tail   = /\/([gim]*)$/.exec(object),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  try {
    return new RegExp(regexp, modifiers);
  } catch (error) {
    return NIL;
  }
}


module.exports = new Type('tag:yaml.org,2002:js/regexp', resolveJavascriptRegExp);
