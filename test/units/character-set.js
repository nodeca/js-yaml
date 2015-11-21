'use strict';


var assert = require('assert');
var yaml = require('../../');


test('Allow astral characters', function () {
  assert.deepEqual(yaml.load('𝑘𝑒𝑦: 𝑣𝑎𝑙𝑢𝑒'), { '𝑘𝑒𝑦': '𝑣𝑎𝑙𝑢𝑒' });
});

test('Forbid non-printable characters', function () {
  assert.throws(function () { yaml.load('\x01'); }, yaml.YAMLException);
  assert.throws(function () { yaml.load('\x7f'); }, yaml.YAMLException);
  assert.throws(function () { yaml.load('\x9f'); }, yaml.YAMLException);
});

test('Forbid lone surrogates', function () {
  assert.throws(function () { yaml.load('\udc00\ud800'); }, yaml.YAMLException);
});

test('Allow non-printable characters inside quoted scalars', function () {
  assert.strictEqual(yaml.load('"\x7f\x9f\udc00\ud800"'), '\x7f\x9f\udc00\ud800');
});

test('Forbid control sequences inside quoted scalars', function () {
  assert.throws(function () { yaml.load('"\x03"'); }, yaml.YAMLException);
});
