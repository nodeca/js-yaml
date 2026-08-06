import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  constructFromEvents,
  EVENT_ID,
  parseEvents,
  YAMLException
} from 'js-yaml'

describe('constructor', () => {
  it('rejects a mapping event stream with an unpaired key', () => {
    const source = 'key: value'
    const events = parseEvents(source, {})
    const valueIndex = events.findLastIndex(event => event.type === EVENT_ID.SCALAR)

    events.splice(valueIndex, 1)

    assert.throws(() => constructFromEvents(events, { source }), YAMLException)
  })
})
