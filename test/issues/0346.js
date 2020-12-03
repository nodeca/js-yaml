'use strict';

var assert = require('assert');
var yaml = require('../../');


it('should not emit spaces in arrays in flow mode between entries using condenseFlow: true', function () {
  var array = [ 'a', 'b' ];
  var dumpedArray = yaml.dump(array, { flowLevel: 0, indent: 0, condenseFlow: true });
  assert.strictEqual(
    dumpedArray,
    '[a,b]\n'
  );
  assert.deepStrictEqual(yaml.load(dumpedArray), array);
});

it('should not emit spaces between key: value and quote keys using condenseFlow: true', function () {
  var object = { a: { b: 'c', d: 'e' } };
  var objectDump = yaml.dump(object, { flowLevel: 0, indent: 0, condenseFlow: true });
  assert.strictEqual(
    objectDump,
    '{"a":{"b":c, "d":e}}\n'
  );
  assert.deepStrictEqual(yaml.load(objectDump), object);
});
