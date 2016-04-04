'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('Duplicated objects within array', function () {
  var obj = { test: 'canary' };
  var arrayWithRefs = [ obj, obj ];

  var obtained = yaml.load(yaml.dump(arrayWithRefs));

  assert.strictEqual(obtained[0].test, 'canary');
  assert.strictEqual(obtained[0], obtained[1]);
});

test('Duplicated arrays within array', function () {
  var array = [ 0, 1 ];
  var arrayWithRefs = [ array, array ];

  var obtained = yaml.load(yaml.dump(arrayWithRefs));

  assert.strictEqual(obtained[0][0], 0);
  assert.strictEqual(obtained[0][1], 1);
  assert.strictEqual(obtained[0], obtained[1]);
});
