'use strict';


var assert = require('assert');
var yaml = require('../../');


test('should indent arrays an extra level by default', function () {
  var output = yaml.safeDump({ array: [ 'a', 'b' ] });
  var expected = 'array:\n  - a\n  - b\n';
  assert.strictEqual(output, expected);
});

test('should not indent arrays an extra level when disabled', function () {
  var output = yaml.safeDump({ array: [ 'a', 'b' ] }, { noArrayIndent: true });
  var expected = 'array:\n- a\n- b\n';
  assert.strictEqual(output, expected);
});
