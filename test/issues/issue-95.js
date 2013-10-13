'use strict';
/*global it */


var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


it('Empty block scalars loaded wrong', function () {
  assert.deepEqual(yaml.load('a: |\nb: .'),  { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: |+\nb: .'), { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: |-\nb: .'), { a: '', b: '.' });

  assert.deepEqual(yaml.load('a: >\nb: .'),  { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: >+\nb: .'), { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: >-\nb: .'), { a: '', b: '.' });

  assert.deepEqual(yaml.load('a: |\n\nb: .'),  { a: '',   b: '.' });
  assert.deepEqual(yaml.load('a: |+\n\nb: .'), { a: '\n', b: '.' });
  assert.deepEqual(yaml.load('a: |-\n\nb: .'), { a: '',   b: '.' });

  assert.deepEqual(yaml.load('a: >\n\nb: .'),  { a: '',   b: '.' });
  assert.deepEqual(yaml.load('a: >+\n\nb: .'), { a: '\n', b: '.' });
  assert.deepEqual(yaml.load('a: >-\n\nb: .'), { a: '',   b: '.' });
});
