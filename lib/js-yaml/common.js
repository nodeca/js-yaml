'use strict';


var NIL = {};


function isNothing(subject) {
  return (undefined === subject) || (null === subject);
}


function isObject(subject) {
  return ('object' === typeof subject) && (null !== subject);
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


// Modified from:
// https://raw.github.com/kanaka/noVNC/d890e8640f20fba3215ba7be8e0ff145aeb8c17c/include/base64.js
var decodeBase64 = (function () {
  var padding = '=', binTable = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,  0, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
  ];

  return function decode(data) {
    var value, code, idx = 0, result = [], leftbits, leftdata;

    leftbits = 0; // number of bits decoded, but yet to be appended
    leftdata = 0; // bits decoded, but yet to be appended

    // Convert one by one.
    for (idx = 0; idx < data.length; idx += 1) {
      code = data.charCodeAt(idx);
      value = binTable[code & 0x7F];

      // Skip LF(NL) || CR
      if (0x0A !== code && 0x0D !== code) {
        // Fail on illegal characters
        if (-1 === value) {
          throw new Error("Illegal characters (code=" + code + ") in position " +
                          idx + ": ordinal not in range(0..128)");
        }

        // Collect data into leftdata, update bitcount
        leftdata = (leftdata << 6) | value;
        leftbits += 6;

        // If we have 8 or more bits, append 8 bits to the result
        if (leftbits >= 8) {
          leftbits -= 8;
          // Append if not padding.
          if (padding !== data.charAt(idx)) {
            result.push((leftdata >> leftbits) & 0xFF);
          }
          leftdata &= (1 << leftbits) - 1;
        }
      }
    }

    // If there are any bits left, the base64 string was corrupted
    if (leftbits) {
      throw new Error("Corrupted base64 string");
    }

    return new Buffer(result);
  };
}());


module.exports.NIL          = NIL;
module.exports.isNothing    = isNothing;
module.exports.isObject     = isObject;
module.exports.getOption    = getOption;
module.exports.repeat       = repeat;
module.exports.extend       = extend;
module.exports.decodeBase64 = decodeBase64;
