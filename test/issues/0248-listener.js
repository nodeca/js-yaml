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
  assert.equal(history.length, 4);
  assert.equal(history[0][0], 'open');
  assert.equal(history[1][0], 'open');
  assert.equal(history[2][0], 'close');
  assert.equal(history[3][0], 'close');
  assert.equal(history[0][1], 0);
  assert.equal(history[3][1], 16);
});

test('Listener informed on a map with a list.', function () {
  var history = [];
  function l(eventType, state) {
    history.push([ eventType, state.position, state.result ]);
  }

  yaml.load('{ a: 1, b: [ 0, xyz ] }', { listener: l });

  var i = -1;
  assert.equal(history[++i][0], 'open'); // doc
  assert.equal(history[++i][0], 'open'); // map

  assert.equal(history[++i][0], 'open'); // key
  assert.equal(history[++i][0], 'close');
  assert.equal(history[i][2], 'a');

  assert.equal(history[++i][0], 'open'); // a value
  assert.equal(history[++i][0], 'close');
  assert.equal(history[i][2], 1);

  assert.equal(history[++i][0], 'open'); // key
  assert.equal(history[++i][0], 'close');
  assert.equal(history[i][2], 'b');

  assert.equal(history[++i][0], 'open'); // b value (list)
  assert.equal(history[++i][0], 'open'); // item in list
  assert.equal(history[++i][0], 'close');
  assert.equal(history[i][2], 0);
  assert.equal(history[++i][0], 'open'); // item in list
  assert.equal(history[++i][0], 'close');

  assert.equal(history[++i][0], 'close'); // b value (list) end
  assert.deepEqual(history[i][2], [ 0, 'xyz' ]);

  assert.equal(history[++i][0], 'close'); // map end
  assert.equal(history[++i][0], 'close'); // doc end

  assert.equal(history.length, ++i);
});
