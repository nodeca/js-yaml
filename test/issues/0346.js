'use strict';

var assert = require('assert');
var yaml = require('../../');


test('should not emit spaces in arrays in flow mode between entries using condenseFlow: true', function () {
  var array = [ 'a', 'b' ];
  var dumpedArray = yaml.dump(array, { flowLevel: 0, indent: 0, condenseFlow: true });
  assert.equal(
    dumpedArray,
    '[a,b]\n'
  );
  assert.deepEqual(yaml.load(dumpedArray), array);
});

test('should not emit spaces between key: value and quote keys using condenseFlow: true', function () {
  var object = { a: { b: 'c' } };
  var objectDump = yaml.dump(object, { flowLevel: 0, indent: 0, condenseFlow: true });
  assert.equal(
    objectDump,
    '{"a":{"b":c}}\n'
  );
  assert.deepEqual(yaml.load(objectDump), object);
});
