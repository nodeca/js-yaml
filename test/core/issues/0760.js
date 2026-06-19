'use strict'

const { it } = require('node:test')

const assert = require('assert')
const yaml = require('js-yaml')

it('Should quote strings that YAML 1.1 parsers would resolve as numbers', function () {
  // Numbers with underscores are no longer resolved as numeric scalars (#627),
  // but YAML 1.1 parsers (and js-yaml <= 4.1.1) still do, so dumping them plain
  // would not round-trip cross-parser. They must be quoted.
  assert.strictEqual(yaml.dump({ test: '0_30' }), "test: '0_30'\n")
  assert.strictEqual(yaml.dump({ test: '1_000' }), "test: '1_000'\n")
  assert.strictEqual(yaml.dump({ test: '0x1_F' }), "test: '0x1_F'\n")
  assert.strictEqual(yaml.dump({ test: '0o7_7' }), "test: '0o7_7'\n")
  assert.strictEqual(yaml.dump({ test: '0b1_0' }), "test: '0b1_0'\n")
  assert.strictEqual(yaml.dump({ test: '1_2.3_4' }), "test: '1_2.3_4'\n")

  // Forms a YAML 1.1 parser never resolved (leading/trailing underscore, or not
  // a number) stay plain.
  assert.strictEqual(yaml.dump({ test: '_30' }), 'test: _30\n')
  assert.strictEqual(yaml.dump({ test: '30_' }), 'test: 30_\n')
  assert.strictEqual(yaml.dump({ test: 'hello_world' }), 'test: hello_world\n')

  // Round-trips through this (YAML 1.2) parser as well.
  assert.deepStrictEqual(yaml.load(yaml.dump({ test: '0_30' })), { test: '0_30' })
})
