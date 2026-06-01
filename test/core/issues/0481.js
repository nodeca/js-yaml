'use strict'

const { it } = require('node:test')

const assert = require('assert')
const yaml = require('js-yaml')

it('Preserve object keys in !!pairs', function () {
  const result = yaml.load(`
pairs: !!pairs
  - { test: 123 }: { test: 123 }
  - scalar: value
  - 123: numeric
  - { test: 456 }: { test: 456 }
flow: !!pairs [ { flow: key }: { flow: value }, plain: scalar ]
timestamp: !!pairs
  - 2001-12-15: date
`)

  assert.deepStrictEqual(result.pairs[0], [{ test: 123 }, { test: 123 }])
  assert.deepStrictEqual(result.pairs[1], ['scalar', 'value'])
  assert.deepStrictEqual(result.pairs[2], ['123', 'numeric'])
  assert.deepStrictEqual(result.pairs[3], [{ test: 456 }, { test: 456 }])

  assert.deepStrictEqual(result.flow[0], [{ flow: 'key' }, { flow: 'value' }])
  assert.deepStrictEqual(result.flow[1], ['plain', 'scalar'])

  assert.strictEqual(result.timestamp[0][0], String(new Date(Date.UTC(2001, 11, 15))))
  assert.strictEqual(result.timestamp[0][1], 'date')
})
