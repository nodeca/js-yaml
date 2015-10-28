'use strict';

var types = [
  'Int8Array',
  'Unit8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array'
];

var values = [ 1, 2, 3 ];

/*eslint-disable new-cap */

types.forEach(function (type) {
  var ctor = global[type];
  if (typeof ctor === 'function') {
    exports[type] = new ctor(values);
  } else {
    exports[type] = values.slice();
  }
});
