'use strict';


var Type = require('../type');


function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}


function validateYamlInteger(data) {
  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) { return false; }

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index+1 === max) { return true; }
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') { continue; }
        if (ch !== '0' && ch !== '1') {
          return false;
        }
        hasDigits = true;
      }
      return hasDigits;
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') { continue; }
        if (!isHexCode(data.charCodeAt(index))) {
          return false;
        }
        hasDigits = true;
      }
      return hasDigits;
    }

    // base 8
    for (; index < max; index++) {
      ch = data[index];
      if (ch === '_') { continue; }
      if (!isOctCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    return hasDigits;
  }

  // base 10 (except 0) or base 60

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') { continue; }
    if (ch === ':') { break; }
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  if (!hasDigits) { return false; }

  // if !base60 - done;
  if (ch !== ':') { return true; }

  // base60 almost not used, no needs to optimize
  return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
}


function resolveYamlInteger(data) {
  var value, sign, base, digits;

  value  = data.replace(/_/g, '');
  sign   = '-' === value[0] ? -1 : 1;
  digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('0' === value) {
    return 0;

  } else if (/^0b/.test(value)) {
    return sign * parseInt(value.slice(2), 2);

  } else if (/^0x/.test(value)) {
    return sign * parseInt(value, 16);

  } else if ('0' === value[0]) {
    return sign * parseInt(value, 8);

  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseInt(v, 10));
    });

    value = 0;
    base = 1;

    digits.forEach(function (d) {
      value += (d * base);
      base *= 60;
    });

    return sign * value;

  } else {
    return sign * parseInt(value, 10);
  }
}


function isInteger(object) {
  return ('[object Number]' === Object.prototype.toString.call(object)) &&
         (0 === object % 1);
}


module.exports = new Type('tag:yaml.org,2002:int', {
  loadKind: 'scalar',
  loadValidator: validateYamlInteger,
  loadResolver: resolveYamlInteger,
  dumpPredicate: isInteger,
  dumpRepresenter: {
    binary:      function (object) { return '0b' + object.toString(2); },
    octal:       function (object) { return '0'  + object.toString(8); },
    decimal:     function (object) { return        object.toString(10); },
    hexadecimal: function (object) { return '0x' + object.toString(16).toUpperCase(); }
  },
  dumpDefaultStyle: 'decimal',
  dumpStyleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});
