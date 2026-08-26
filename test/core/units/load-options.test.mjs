import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { load, loadAll, FAILSAFE_SCHEMA, YAML11_SCHEMA, YAMLException } from 'js-yaml'

function createMergeChain (count) {
  const lines = ['a0: &a0 { k0: 0 }']

  for (let i = 1; i < count; i++) {
    lines.push(`a${i}: &a${i} { <<: *a${i - 1}, k${i}: ${i} }`)
  }

  lines.push(`b: *a${count - 1}`)
  return `${lines.join('\n')}\n`
}

describe('load options', () => {
  it('filename — included in error messages', () => {
    assert.throws(() => load('@', { filename: 'my.yml' }), /my\.yml/)
  })

  it('schema — controls scalar resolution', () => {
    // FAILSAFE knows only str/seq/map, so numbers stay strings.
    assert.deepEqual(load('v: 1', { schema: FAILSAFE_SCHEMA }), { v: '1' })
    assert.deepEqual(load('v: 1'), { v: 1 })
  })

  it('json — tolerates duplicate mapping keys', () => {
    assert.throws(() => load('a: 1\na: 2'), YAMLException)
    assert.deepEqual(load('a: 1\na: 2', { json: true }), { a: 2 })
  })

  it('maxDepth — caps nesting depth', () => {
    const nested = '['.repeat(10) + ']'.repeat(10)

    assert.deepEqual(load(nested, { maxDepth: 20 }), JSON.parse(nested))
    assert.throws(() => load(nested, { maxDepth: 5 }), /maxDepth/)
  })

  it('maxTotalMergeKeys — caps total merge keys', () => {
    const merge = (n) =>
      Array.from({ length: n }, (_, i) => `- &x${i} {a${i}: ${i}}`).join('\n') +
      '\n- <<: [' + Array.from({ length: n }, (_, i) => `*x${i}`).join(', ') + ']\n'

    assert.doesNotThrow(() => load(merge(3), { schema: YAML11_SCHEMA, maxTotalMergeKeys: 6 }))
    assert.throws(() => load(merge(3), { schema: YAML11_SCHEMA, maxTotalMergeKeys: 2 }), /maxTotalMergeKeys/)
    assert.doesNotThrow(() => load(merge(3), { schema: YAML11_SCHEMA, maxTotalMergeKeys: -1 }))

    const result = load(createMergeChain(150), { schema: YAML11_SCHEMA, maxTotalMergeKeys: -1 })
    assert.equal(Object.keys(result.b).length, 150)
  })

  it('loadAll — maxTotalMergeKeys is shared across all documents', () => {
    const src = `
---
a: &a { k1: 1, k2: 2 }
b: { <<: *a }
---
a: &a { k1: 1, k2: 2 }
b: { <<: *a }
`
    assert.doesNotThrow(() => loadAll(src, { schema: YAML11_SCHEMA, maxTotalMergeKeys: 6 }))
    assert.throws(() => loadAll(src, { schema: YAML11_SCHEMA, maxTotalMergeKeys: 3 }), /maxTotalMergeKeys/)
  })

  it('maxAliases — caps alias count', () => {
    const src = `
base: &base { a: 1 }
one: *base
two: *base
`
    assert.deepEqual(load(src).one, { a: 1 })
    assert.doesNotThrow(() => load(src, { maxAliases: 2 }))
    assert.throws(() => load(src, { maxAliases: 1 }), /maxAliases/)
    assert.throws(() => load(src, { maxAliases: 0 }), /maxAliases/)
    assert.doesNotThrow(() => load(src, { maxAliases: -1 }))
  })

  it('loadAll — maxAliases is applied per document', () => {
    const src = `
---
a: &a 1
b: *a
---
a: &a 1
b: *a
`
    assert.doesNotThrow(() => loadAll(src, { maxAliases: 1 }))
    assert.throws(() => loadAll(src, { maxAliases: 0 }), /maxAliases/)
  })

  it('loadAll — options reach every argument form', () => {
    const src = 'test: 1\ntest: 2'
    const expected = [{ test: 2 }]

    // options as 2nd arg, and with an explicit null iterator as 3rd arg
    assert.deepEqual(loadAll(src, { json: true }), expected)
    assert.deepEqual(loadAll(src, null, { json: true }), expected)

    // an iterator returns nothing and receives each document instead
    const collected = []
    assert.equal(loadAll(src, (doc) => collected.push(doc), { json: true }), undefined)
    assert.deepEqual(collected, expected)
  })

  it('empty input — load throws, loadAll is empty', () => {
    assert.throws(() => load(''), YAMLException)
    assert.throws(() => load('   \n# comment\n'), YAMLException)
    assert.deepEqual(loadAll(''), [])
  })
})
