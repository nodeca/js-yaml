'use strict';


var assert = require('assert');
var yaml = require('../../');


suite('Should not escape emojis', function () {
  test('plain', function () {
    assert.strictEqual(yaml.safeDump('😀'), '😀\n');
  });

  test('escape \\ and " in double-quoted', function () {
    assert.strictEqual(yaml.safeDump('\u0007 😀 escape\\ escaper"'), '"\\a 😀 escape\\\\ escaper\\""\n');
  });

  test('escape non-printables', function () {
    assert.strictEqual(yaml.safeDump('a😀\nb\u0001c'), '"a😀\\nb\\x01c"\n');
  });
});
