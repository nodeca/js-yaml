import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CORE_SCHEMA,
  eventsToAst,
  EVENT_SCALAR,
  parseEvents
} from 'js-yaml'

describe('ast from_events', () => {
  it('rejects a mapping event stream with an unpaired key', () => {
    const source = 'key: value'
    const events = parseEvents(source, {})
    const valueIndex = events.findLastIndex(event => event.type === EVENT_SCALAR)

    events.splice(valueIndex, 1)

    assert.throws(() => eventsToAst(events, { source, schema: CORE_SCHEMA }))
  })
})
