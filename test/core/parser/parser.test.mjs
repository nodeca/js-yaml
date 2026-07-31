import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EVENT_SCALAR, getScalarValue, loadAll, parseEvents } from 'js-yaml'

describe('parser', () => {
  it('keeps an implicit null mapping value before a document marker', () => {
    const samples = [
      ['a:\n---\nx: 1\n', ['a', '', 'x', '1']],
      ['a:\n...\n', ['a', '']]
    ]

    for (const [source, expected] of samples) {
      const values = parseEvents(source, {})
        .filter(event => event.type === EVENT_SCALAR)
        .map(event => getScalarValue(source, event))

      assert.deepEqual(values, expected)
    }

    assert.deepEqual(
      loadAll('a:\n---\nx: 1\n'),
      [{ a: null }, { x: 1 }]
    )
  })
})
