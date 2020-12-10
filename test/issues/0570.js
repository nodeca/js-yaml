'use strict';


const assert = require('assert');
const yaml = require('../../');


it('should dump null in different styles', function () {
  let dump, src = { foo: null, bar: 1 };

  let tests = {
    lowercase: 'null',
    uppercase: 'NULL',
    camelcase: 'Null',
    canonical: '~',
    empty: ''
  };

  for (let [ name, value ] of Object.entries(tests)) {
    dump = yaml.dump(src, { styles: { '!!null': name } });
    assert.strictEqual(dump, 'foo: ' + value + '\nbar: 1\n');
    assert.deepStrictEqual(yaml.load(dump), src);
  }
});
