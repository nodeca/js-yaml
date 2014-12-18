'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('Named null', function () {
  assert.deepEqual(yaml.load('---\ntest: !!null \nfoo: bar'), { test: null, foo: 'bar' });
});
