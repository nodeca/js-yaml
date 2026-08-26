'use strict'

const { describe, it } = require('node:test')

const assert = require('assert')
const yaml = require('js-yaml')

function createMergeChain (count) {
  const lines = ['a0: &a0 { k0: 0 }']

  for (let i = 1; i < count; i++) {
    lines.push(`a${i}: &a${i} { <<: *a${i - 1}, k${i}: ${i} }`)
  }

  lines.push(`b: *a${count - 1}`)
  return `${lines.join('\n')}\n`
}

describe('loader parameters', function () {
  const testStr = 'test: 1 \ntest: 2'
  const expected = [{ test: 2 }]
  let result

  it('loadAll(input, options)', function () {
    result = yaml.loadAll(testStr, { json: true })
    assert.deepStrictEqual(result, expected)

    result = []
    yaml.loadAll(testStr, function (doc) {
      result.push(doc)
    }, { json: true })
    assert.deepStrictEqual(result, expected)
  })

  it('loadAll(input, null, options)', function () {
    result = yaml.loadAll(testStr, null, { json: true })
    assert.deepStrictEqual(result, expected)

    result = []
    yaml.loadAll(testStr, function (doc) {
      result.push(doc)
    }, { json: true })
    assert.deepStrictEqual(result, expected)
  })

  it('loadAll(input, options)', function () {
    result = yaml.loadAll(testStr, { json: true })
    assert.deepStrictEqual(result, expected)

    result = []
    yaml.loadAll(testStr, function (doc) {
      result.push(doc)
    }, { json: true })
    assert.deepStrictEqual(result, expected)
  })

  it('loadAll(input, null, options)', function () {
    result = yaml.loadAll(testStr, null, { json: true })
    assert.deepStrictEqual(result, expected)

    result = []
    yaml.loadAll(testStr, function (doc) {
      result.push(doc)
    }, { json: true })
    assert.deepStrictEqual(result, expected)
  })

  it('empty input', function () {
    // https://github.com/nodeca/js-yaml/issues/565#issuecomment-659696047
    // NOTE: in theory, can throw instead of undefined, for load().
    assert.strictEqual(yaml.load(''), undefined)
    assert.deepStrictEqual(yaml.loadAll(''), [])
  })

  it('maxTotalMergeKeys - caps total merge keys', function () {
    const merge = n =>
      Array.from({ length: n }, (_, i) => `- &x${i} {a${i}: ${i}}`).join('\n') +
      '\n- <<: [' + Array.from({ length: n }, (_, i) => `*x${i}`).join(', ') + ']\n'

    assert.doesNotThrow(function () {
      yaml.load(merge(3), { maxTotalMergeKeys: 6 })
    })
    assert.throws(function () {
      yaml.load(merge(3), { maxTotalMergeKeys: 2 })
    }, /maxTotalMergeKeys/)
    assert.doesNotThrow(function () {
      yaml.load(merge(3), { maxTotalMergeKeys: -1 })
    })

    const result = yaml.load(createMergeChain(150), { maxTotalMergeKeys: -1 })
    assert.strictEqual(Object.keys(result.b).length, 150)
  })

  it('loadAll - maxTotalMergeKeys is shared across all documents', function () {
    const src = `
---
a: &a { k1: 1, k2: 2 }
b: { <<: *a }
---
a: &a { k1: 1, k2: 2 }
b: { <<: *a }
`

    assert.doesNotThrow(function () {
      yaml.loadAll(src, { maxTotalMergeKeys: 6 })
    })
    assert.throws(function () {
      yaml.loadAll(src, { maxTotalMergeKeys: 3 })
    }, /maxTotalMergeKeys/)
  })
})
