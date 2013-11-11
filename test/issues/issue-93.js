'use strict';
/*global it */


var assert = require('assert');


it('Unwanted line breaks in folded scalars', function () {
  var data = require('./data/issue-93.yml');

  assert.strictEqual(data.first,  'a b\n  c\n  d\ne f\n');
  assert.strictEqual(data.second, 'a b\n  c\n\n  d\ne f\n');
  assert.strictEqual(data.third,  'a b\n\n  c\n  d\ne f\n');
});
