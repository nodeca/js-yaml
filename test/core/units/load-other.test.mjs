import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { load, loadAll, YAMLException } from 'js-yaml'

describe('core/units/load-other', () => {
  describe('BOM', () => {
    it('accepts BOM at the start of a document', () => {
      const expected = { abc: 5, cba: ['Xyz', 'Zyx'] }

      assert.deepStrictEqual(load(`\uFEFFabc: 5
cba:
  - Xyz
  - Zyx
`), expected)

      assert.deepStrictEqual(load(`\uFEFF# comment
abc: 5
cba:
  - Xyz
  - Zyx
`), expected)
    })

    it('accepts BOM before each document in a stream', () => {
      assert.deepStrictEqual(loadAll(`---
foo: bar
\uFEFF---
abc: 5
cba:
  - Xyz
  - Zyx
...
\uFEFF---
last: document
`), [
        { foo: 'bar' },
        { abc: 5, cba: ['Xyz', 'Zyx'] },
        { last: 'document' }
      ])
    })
  })

  it('Loading multidocument source using `load` should cause an error', () => {
    assert.throws(() => {
      load('--- # first document\n--- # second document\n')
    }, YAMLException)
  })

  it('reads a flow sequence explicit pair with an empty value', () => {
    assert.deepEqual(load('[? foo]'), [{ foo: null }])
  })

  it('folds CRLF line breaks in flow scalars', () => {
    assert.equal(load('"folded\r\nto a space"'), 'folded to a space')
    assert.equal(load("'folded\r\nto a space'"), 'folded to a space')
    assert.equal(load('"joined\\\r\nwith continuation"'), 'joinedwith continuation')
  })

  it('reads 8-digit unicode escapes in double quoted scalars', () => {
    assert.equal(load(String.raw`"\U0001F600"`), '\u{1F600}')
  })

  it('allows digits in named tag handles', () => {
    assert.equal(load(`
%TAG !a1! tag:yaml.org,2002:
--- !a1!str 123
`), '123')
  })
})
