'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Allow astral characters', function () {
  assert.deepStrictEqual(yaml.load('𝑘𝑒𝑦: 𝑣𝑎𝑙𝑢𝑒'), { '𝑘𝑒𝑦': '𝑣𝑎𝑙𝑢𝑒' });
});

it('Forbid non-printable characters', function () {
  assert.throws(function () { yaml.load('\x01'); }, yaml.YAMLException);
  assert.throws(function () { yaml.load('\x7f'); }, yaml.YAMLException);
  assert.throws(function () { yaml.load('\x9f'); }, yaml.YAMLException);
});

it('Forbid lone surrogates', function () {
  assert.throws(function () { yaml.load('\udc00\ud800'); }, yaml.YAMLException);
});

it('Allow non-printable characters inside quoted scalars', function () {
  assert.strictEqual(yaml.load('"\x7f\x9f\udc00\ud800"'), '\x7f\x9f\udc00\ud800');
});

it('Forbid control sequences inside quoted scalars', function () {
  assert.throws(function () { yaml.load('"\x03"'); }, yaml.YAMLException);
});
