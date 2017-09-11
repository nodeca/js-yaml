'use strict';


var assert = require('assert');
var yaml = require('../../');


test('should dump astrals as codepoint', function () {
  assert.deepEqual(yaml.safeDump('😀'), '"\\U0001F600"\n');
  assert.deepEqual(yaml.safeLoad('"\\U0001F600"'), '😀');
});
