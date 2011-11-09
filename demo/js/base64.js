// Modified from:
// https://raw.github.com/kanaka/noVNC/d890e8640f20fba3215ba7be8e0ff145aeb8c17c/include/base64.js
(function (exports) {
  'use strict';

  var noop = function () {},
      logger = {warn: noop, error: noop},
      padding = '=',
      chrTable = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
                 '0123456789+/',
      binTable = [
        -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1,
        -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1,
        -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,62, -1,-1,-1,63,
        52,53,54,55, 56,57,58,59, 60,61,-1,-1, -1, 0,-1,-1,
        -1, 0, 1, 2,  3, 4, 5, 6,  7, 8, 9,10, 11,12,13,14,
        15,16,17,18, 19,20,21,22, 23,24,25,-1, -1,-1,-1,-1,
        -1,26,27,28, 29,30,31,32, 33,34,35,36, 37,38,39,40,
        41,42,43,44, 45,46,47,48, 49,50,51,-1, -1,-1,-1,-1
      ];

  if (console) {
    logger.warn = console.warn || console.error || console.log || noop;
    logger.warn = console.error || console.warn || console.log || noop;
  }

  function encode(str) {
    var result = '', length = str.length, i, c1, c2, c3;

    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < (length - 2); i += 3) {
      c1 = str.charCodeAt(i);
      c2 = str.charCodeAt(i+1);
      c3 = str.charCodeAt(i+2);

      result += chrTable[c1 >> 2];
      result += chrTable[((c1 & 0x03) << 4) + (c2 >> 4)];
      result += chrTable[((c2 & 0x0f) << 2) + (c3 >> 6)];
      result += chrTable[c3 & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length%3) {
      i = length - (length%3);
      c1 = str.charCodeAt(i);
      c2 = str.charCodeAt(i+1);
      result += chrTable[c1 >> 2];
      if ((length%3) === 2) {
        result += chrTable[((c1 & 0x03) << 4) + (c2 >> 4)];
        result += chrTable[(c2 & 0x0f) << 2];
        result += padding;
      } else {
        result += chrTable[(c1 & 0x03) << 4];
        result += padding + padding;
      }
    }

    return result;
  }

  function decode(data) {
    var value, code, idx = 0, result = [],
        leftbits = 0, // number of bits decoded, but yet to be appended
        leftdata = 0; // bits decoded, but yet to be appended

    // Convert one by one.
    for (idx = 0; idx < data.length; idx++) {
      code = data.charCodeAt(idx);
      value = binTable[code & 0x7F];

      // Skip LF(NL) || CR
      if (0x0A !== code && 0x0D !== code) {
        // Fail on illegal characters and whitespace
        if (-1 === value) {
          logger.warn("Illegal characters (code=" + code + ") in position " +
                      idx + ": ordinal not in range(128)");
        }

        // Collect data into leftdata, update bitcount
        leftdata = (leftdata << 6) | value;
        leftbits += 6;

        // If we have 8 or more bits, append 8 bits to the result
        if (leftbits >= 8) {
          leftbits -= 8;
          // Append if not padding.
          if (padding !== data.charAt(idx)) {
            result.push(String.fromCharCode((leftdata >> leftbits) & 0xFF));
          }
          leftdata &= (1 << leftbits) - 1;
        }
      }
    }

    // If there are any bits left, the base64 string was corrupted
    if (leftbits) {
      logger.error("Corrupted base64 string");
      return null;
    }

    return result.join('');
  }

  exports.base64 = {encode: encode, decode: decode};
}(window));
