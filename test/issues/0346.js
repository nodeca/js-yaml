'use strict';

var assert = require('assert');
var yaml = require('../../');


test('should not emit spaces in arrays in flow mode between entries using condenseFlow: true', function () {
  assert.equal(
    yaml.dump([ 'a', 'b' ], { flowLevel: 0, indent: 0, condenseFlow: true }),
    '[a,b]\n'
  );
});

test('should not emit spaces between key: value in objects in flow sequence using condenseFlow: true', function () {
  assert.equal(
    yaml.dump({ a: { b: 'c' } }, { flowLevel: 0, indent: 0, condenseFlow: true }),
    '{a:{b:c}}\n'
  );
});
