'use strict';


var assert = require('assert');
var yaml = require('../../');


test('should define __proto__ as a value (not invoke setter)', function () {
  var object = yaml.load('{ __proto__: {polluted: bar} }');

  assert.strictEqual(({}).hasOwnProperty.call(yaml.load('{}'), '__proto__'), false);
  assert.strictEqual(({}).hasOwnProperty.call(object, '__proto__'), true);
  assert(!object.polluted);
});


test('should merge __proto__ as a value with << operator', function () {
  var object = yaml.load('\npayload: &ref\n  polluted: bar\n\nfoo:\n  <<:\n    __proto__: *ref\n  ');

  assert.strictEqual(({}).hasOwnProperty.call(yaml.load('{}'), '__proto__'), false);
  assert.strictEqual(({}).hasOwnProperty.call(object.foo, '__proto__'), true);
  assert(!object.foo.polluted);
});
