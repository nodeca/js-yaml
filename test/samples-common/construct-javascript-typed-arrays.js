
const types = [
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

const values = [ 1, 2, 3 ]

types.forEach( function ( type ) {
  var ctor = global[type]
  if ( 'function' == typeof ctor )
    exports[type] = new ctor( values )
  else
    exports[type] = values.slice()
})
