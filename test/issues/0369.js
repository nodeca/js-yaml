'use strict';


var assert = require('assert');
var yaml = require('../../');


test('should load astrals as codepoint', function () {
  assert.deepEqual(yaml.safeLoad('"\\U0001F600"'), '😀');
});
