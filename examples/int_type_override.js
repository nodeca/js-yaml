// This example overrides built-in !!int type to return BigInt instead of a Number
//

'use strict';

/*global BigInt*/
/*eslint-disable no-console*/

const util = require('util');
const yaml = require('../');


// keep most of the original `int` options as is
let options = Object.assign({}, yaml.types.int.options);

options.construct = data => {
  let value = data, sign = 1n, ch;

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1n;
    value = value.slice(1);
    ch = value[0];
  }

  return sign * BigInt(value);
};


options.predicate = object => {
  return Object.prototype.toString.call(object) === '[object BigInt]' ||
         yaml.types.int.options.predicate(object);
};


let BigIntType = new yaml.Type('tag:yaml.org,2002:int', options);

const SCHEMA = yaml.DEFAULT_SCHEMA.extend({ implicit: [ BigIntType ] });

const data = `
bigint: -12_345_678_901_234_567_890
`;

const loaded = yaml.load(data, { schema: SCHEMA });

console.log('Parsed as:');
console.log('-'.repeat(70));
console.log(util.inspect(loaded, false, 20, true));

console.log('');
console.log('');
console.log('Dumped as:');
console.log('-'.repeat(70));
console.log(yaml.dump(loaded, { schema: SCHEMA }));
