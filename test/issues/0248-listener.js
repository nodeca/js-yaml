'use strict';

var assert = require('assert');
var yaml = require('../../');

test('Listener informed on a very simple scalar.', function () {
  var history = [];
  function l(eventType, state) {
    history.push([ eventType, state.position ]);
  }

  yaml.load('a_simple_scalar', { listener: l });

  // 2 open events then 2 close events
  assert.strictEqual(history.length, 4);
  assert.strictEqual(history[0][0], 'open');
  assert.strictEqual(history[1][0], 'open');
  assert.strictEqual(history[2][0], 'close');
  assert.strictEqual(history[3][0], 'close');
  assert.strictEqual(history[0][1], 0);
  assert.strictEqual(history[3][1], 16);
});

test('Listener informed on a map with a list.', function () {
  var history = [];
  function l(eventType, state) {
    history.push([ eventType, state.position, state.result ]);
  }

  yaml.load('{ a: 1, b: [ 0, xyz ] }', { listener: l });

  var i = -1;
  assert.strictEqual(history[++i][0], 'open'); // doc
  assert.strictEqual(history[++i][0], 'open'); // map

  assert.strictEqual(history[++i][0], 'open'); // key
  assert.strictEqual(history[++i][0], 'close');
  assert.strictEqual(history[i][2], 'a');

  assert.strictEqual(history[++i][0], 'open'); // a value
  assert.strictEqual(history[++i][0], 'close');
  assert.strictEqual(history[i][2], 1);

  assert.strictEqual(history[++i][0], 'open'); // key
  assert.strictEqual(history[++i][0], 'close');
  assert.strictEqual(history[i][2], 'b');

  assert.strictEqual(history[++i][0], 'open'); // b value (list)
  assert.strictEqual(history[++i][0], 'open'); // item in list
  assert.strictEqual(history[++i][0], 'close');
  assert.strictEqual(history[i][2], 0);
  assert.strictEqual(history[++i][0], 'open'); // item in list
  assert.strictEqual(history[++i][0], 'close');

  assert.strictEqual(history[++i][0], 'close'); // b value (list) end
  assert.deepEqual(history[i][2], [ 0, 'xyz' ]);

  assert.strictEqual(history[++i][0], 'close'); // map end
  assert.strictEqual(history[++i][0], 'close'); // doc end

  assert.strictEqual(history.length, ++i);
});
