'use strict';


var assert = require('assert');
var yaml = require('../../');


it('should indent arrays an extra level by default', function () {
  var output = yaml.dump({ array: [ 'a', 'b' ] });
  var expected = 'array:\n  - a\n  - b\n';
  assert.strictEqual(output, expected);
});

it('should not indent arrays an extra level when disabled', function () {
  var output = yaml.dump({ array: [ 'a', 'b' ] }, { noArrayIndent: true });
  var expected = 'array:\n- a\n- b\n';
  assert.strictEqual(output, expected);
});

it('should always indent nested arrays', function () {
  var output = yaml.dump({ array: [ 'a', [ 'b', 'c' ], 'd' ] }, { noArrayIndent: true });
  var expected = 'array:\n- a\n- - b\n  - c\n- d\n';
  assert.strictEqual(output, expected);
});
