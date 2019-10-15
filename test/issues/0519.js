'use strict';

var assert = require('assert');
var yaml   = require('../../');

test('Loader should not strip quotes for lines containing equals sign', function () {
  var line_with_equals_sign = "'='";
  var result_of_load_and_dump = yaml.dump(yaml.load(line_with_equals_sign));
  assert.strictEqual(line_with_equals_sign, result_of_load_and_dump);
});
