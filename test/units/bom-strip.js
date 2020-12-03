'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('BOM strip', function () {
  assert.deepEqual(yaml.load('\uFEFFfoo: bar\n'), { foo: 'bar' });
  assert.deepEqual(yaml.load('foo: bar\n'), { foo: 'bar' });
});
