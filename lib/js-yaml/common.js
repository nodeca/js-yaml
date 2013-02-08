'use strict';


var YAMLException = require('./exception');


var NIL = {};


function isNothing(subject) {
  return (undefined === subject) || (null === subject);
}


function isObject(subject) {
  return ('object' === typeof subject) && (null !== subject);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) {
    return sequence;
  } else if (isNothing(sequence)) {
    return [];
  } else {
    return [ sequence ];
  }
}


function getSetting(settings, name) {
  if (!isNothing(settings) && !isNothing(settings[name])) {
    return settings[name];
  } else {
    throw new YAMLException('Required "' + name + '" setting is missed.');
  }
}


function getOption(options, name, alternative) {
  if (!isNothing(options) && !isNothing(options[name])) {
    return options[name];
  } else {
    return alternative;
  }
}


function extend(target, source) {
  var index, length, key, sourceKeys = Object.keys(source);

  for (index = 0, length = sourceKeys.length; index < length; index += 1) {
    key = sourceKeys[index];
    target[key] = source[key];
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


module.exports.NIL        = NIL;
module.exports.isNothing  = isNothing;
module.exports.isObject   = isObject;
module.exports.toArray    = toArray;
module.exports.getSetting = getSetting;
module.exports.getOption  = getOption;
module.exports.repeat     = repeat;
module.exports.extend     = extend;
