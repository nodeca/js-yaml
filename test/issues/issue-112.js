'use strict';
/*global it */


var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


it('Plain scalar "constructor" parsed as `null`', function () {
  assert.strictEqual(yaml.load('constructor'),          'constructor');
  assert.deepEqual(yaml.load('constructor: value'),     { 'constructor': 'value' });
  assert.deepEqual(yaml.load('key: constructor'),       { 'key': 'constructor' });
  assert.deepEqual(yaml.load('{ constructor: value }'), { 'constructor': 'value' });
  assert.deepEqual(yaml.load('{ key: constructor }'),   { 'key': 'constructor' });
});
