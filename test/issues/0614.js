'use strict';

/* global BigInt */


const assert = require('assert');
const yaml   = require('../../');


it('Should allow int override', function () {
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


  let BigIntType = new yaml.Type('tag:yaml.org,2002:int', options);

  const SCHEMA = yaml.DEFAULT_SCHEMA.extend({ implicit: [ BigIntType ] });

  const data = `
int: -123_456_789
bigint: -12_345_678_901_234_567_890
float: -12_345_678_901_234_567_890.1234
`;

  assert.deepStrictEqual(yaml.load(data, { schema: SCHEMA }), {
    int: -123456789n,
    bigint: -12345678901234567890n,
    float: -12345678901234567000 // precision loss expected
  });
});
