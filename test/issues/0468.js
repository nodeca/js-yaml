'use strict';


var assert = require('assert');
var yaml = require('../..');

test('should not indent arrays an extra level when disabled', function () {
  var output = yaml.dump([{"a":"a_value","b":"b_value"},{"a":"a2_value","expanded":true,"items":[{"a":"a_a_value","b":"a_b_value"}]}], { noArrayIndent: true });
  var expected = '- a: a_value\n  b: b_value\n- a: a2_value\n  expanded: true\n  items:\n  - a: a_a_value\n    b: a_b_value\n';
  assert.strictEqual(output, expected);
});