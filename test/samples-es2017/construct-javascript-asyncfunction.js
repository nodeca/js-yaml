'use strict';


var assert = require('assert');


function testHandler(actual) {
  var expected = testHandler.expected;

  assert.strictEqual(actual.length, expected.length);

  assert.strictEqual(actual.length, expected.length);

}

testHandler.expected = [
  async function (r) {
    await r;
    return r + 1;
  },
  async function (q) {
    await q;
    return q + 1;
  }
];


module.exports = testHandler;
