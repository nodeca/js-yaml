'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('BOM strip', function () {
  assert.deepEqual(yaml.safeLoad('\uFEFFfoo: bar\n'), { foo: 'bar' });
  assert.deepEqual(yaml.safeLoad('foo: bar\n'), { foo: 'bar' });
});
