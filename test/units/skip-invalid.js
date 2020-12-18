'use strict';


var assert = require('assert');
var yaml   = require('../../');


var sample = {
  number: 42,
  string: 'hello',
  func:   function (a, b) { return a + b; },
  regexp: /^hel+o/,
  array:  [ 1, 2, 3 ]
};


var expected = {
  number: 42,
  string: 'hello',
  array:  [ 1, 2, 3 ]
};


it('Dumper must throw an exception on invalid type when option `skipInvalid` is false.', function () {
  assert.throws(function () {
    yaml.dump(sample, { skipInvalid: false });
  }, yaml.YAMLException);
});


it('Dumper must skip pairs and values with invalid types when option `skipInvalid` is true.', function () {
  assert.deepStrictEqual(yaml.load(yaml.dump(sample, { skipInvalid: true })), expected);
});
