'use strict';


var assert = require('assert');
var yaml   = require('../../');


it('Empty block scalars loaded wrong', function () {
  assert.deepStrictEqual(yaml.load('a: |\nb: .'),  { a: '', b: '.' });
  assert.deepStrictEqual(yaml.load('a: |+\nb: .'), { a: '', b: '.' });
  assert.deepStrictEqual(yaml.load('a: |-\nb: .'), { a: '', b: '.' });

  assert.deepStrictEqual(yaml.load('a: >\nb: .'),  { a: '', b: '.' });
  assert.deepStrictEqual(yaml.load('a: >+\nb: .'), { a: '', b: '.' });
  assert.deepStrictEqual(yaml.load('a: >-\nb: .'), { a: '', b: '.' });

  assert.deepStrictEqual(yaml.load('a: |\n\nb: .'),  { a: '',   b: '.' });
  assert.deepStrictEqual(yaml.load('a: |+\n\nb: .'), { a: '\n', b: '.' });
  assert.deepStrictEqual(yaml.load('a: |-\n\nb: .'), { a: '',   b: '.' });

  assert.deepStrictEqual(yaml.load('a: >\n\nb: .'),  { a: '',   b: '.' });
  assert.deepStrictEqual(yaml.load('a: >+\n\nb: .'), { a: '\n', b: '.' });
  assert.deepStrictEqual(yaml.load('a: >-\n\nb: .'), { a: '',   b: '.' });
});
