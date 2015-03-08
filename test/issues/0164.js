'use strict';


var assert = require('assert');
var yaml = require('../../');


test('Object properties should be created using `defineProperty`', function () {
  // jshint proto:true
  assert.strictEqual(yaml.load('__proto__: 42').__proto__, 42);
});
