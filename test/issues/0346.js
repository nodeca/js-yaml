'use strict';

var assert = require('assert');
var yaml = require('../../');


test('no spaces should be added in arrays in flow mode between entries when using condense: true', function () {
  assert.equal(
    yaml.dump([ 'a', 'b' ], { flowLevel: 0, indent: 0, condense: true }),
    '[a,b]\n'
  );
});

test('no spaces should be added between key: value in objects in flow sequence when using condense: true', function () {
  assert.equal(
    yaml.dump({ a: { b: 'c' } }, { flowLevel: 0, indent: 0, condense: true }),
    '{a:{b:c}}\n'
  );
});
