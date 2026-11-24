import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EVENT_ID, getScalarValue, load, loadAll, parseEvents, YAMLException } from 'js-yaml'

describe('parser', () => {
  it('keeps an implicit null mapping value before a document marker', () => {
    const samples = [
      ['a:\n---\nx: 1\n', ['a', '', 'x', '1']],
      ['a:\n...\n', ['a', '']]
    ]

    for (const [source, expected] of samples) {
      const values = parseEvents(source, {})
        .filter(event => event.type === EVENT_ID.SCALAR)
        .map(event => getScalarValue(source, event))

      assert.deepEqual(values, expected)
    }

    assert.deepEqual(
      loadAll('a:\n---\nx: 1\n'),
      [{ a: null }, { x: 1 }]
    )
  })

  it('ends a whitespace-only block scalar at a less indented line', () => {
    assert.deepEqual(load('a: |+\n   \nb: 1\n'), { a: '\n', b: 1 })
    assert.deepEqual(load('a:\n  b: |+\n      \n  c: 1\n'), { a: { b: '\n', c: 1 } })
    // Leading empty lines longer than the first content line are still an error
    assert.throws(() => load('a: |\n   \n b\n'), /bad indentation/)
  })

  it('ends an explicit-indent block scalar at a less indented line', () => {
    // An indentation indicator is relative to the parent node but the content
    // indent is never less than 1, so a line at column 0 ends the scalar
    // instead of being silently consumed (#807).
    assert.throws(() => load('|1\n?'), YAMLException)
    assert.throws(() => load('|1\n? x'), YAMLException)
    assert.throws(() => load('|1\nx'), YAMLException)
    assert.throws(() => load('|2\n ?'), YAMLException)
    assert.throws(() => load('>1\n?'), YAMLException)
    assert.deepEqual(load('|1\n x'), 'x\n')
    assert.deepEqual(load('|1\n  x'), ' x\n')
  })
})
