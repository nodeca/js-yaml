import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseEvents } from '../../../src/parser/parser.ts'
import {
  tagNameFull,
  tagNameShort
} from '../../../src/common/tagname.ts'

const YAML_PREFIX = 'tag:yaml.org,2002:'

describe('tagname', () => {
  describe('tagNameFull', () => {
    it('expands the default handles to their prefixes', () => {
      assert.equal(tagNameFull('!!str'), `${YAML_PREFIX}str`)
      assert.equal(tagNameFull('!!map'), `${YAML_PREFIX}map`)
    })

    it('keeps a primary-handle (local) tag verbatim', () => {
      assert.equal(tagNameFull('!local'), '!local')
      assert.equal(tagNameFull('!'), '!')
    })

    it('unwraps a verbatim tag', () => {
      assert.equal(tagNameFull(`!<${YAML_PREFIX}str>`), `${YAML_PREFIX}str`)
      assert.equal(tagNameFull('!<!foo>'), '!foo')
    })

    it('resolves a registered custom handle', () => {
      const handlers = { '!e!': 'tag:example.com,2024:' }
      assert.equal(tagNameFull('!e!foo', handlers), 'tag:example.com,2024:foo')
      assert.equal(tagNameFull('!e!21', { '!e!': '!%25' }), '!%21')
    })

    it('lets user handles override the defaults', () => {
      const handlers = { '!!': 'tag:custom,1:' }
      assert.equal(tagNameFull('!!str', handlers), 'tag:custom,1:str')
    })

    it('leaves an unregistered named handle untouched', () => {
      // No matching user or default handle -> prefix falls back to the handle itself.
      assert.equal(tagNameFull('!x!foo'), '!x!foo')
    })

    it('percent-decodes the resolved name', () => {
      assert.equal(tagNameFull('!foo%20bar'), '!foo bar')
      assert.equal(tagNameFull('!%E2%9C%93'), '!✓') // checkmark
      assert.equal(tagNameFull('!%c3%a9%E2%9C%93%f0%9f%98%80+%2521'), '!é✓😀+%21')
    })
  })

  describe('tagNameShort', () => {
    it('shortens the yaml.org prefix to "!!"', () => {
      assert.equal(tagNameShort(`${YAML_PREFIX}str`), '!!str')
      assert.equal(tagNameShort(`${YAML_PREFIX}`), '!!')
      assert.equal(tagNameShort(`${YAML_PREFIX}a,b`), '!!a%2Cb')
    })

    it('keeps a local "!" tag, re-encoding its body', () => {
      assert.equal(tagNameShort('!local'), '!local')
      assert.equal(tagNameShort('!foo bar'), '!foo%20bar')
      assert.equal(tagNameShort('!a!b'), '!a%21b')
      assert.equal(tagNameShort('!a.b!,[]{}%'), '!a.b%21%2C%5B%5D%7B%7D%25')
      assert.equal(tagNameShort('!é✓😀+%21'), '!%C3%A9%E2%9C%93%F0%9F%98%80+%2521')
    })

    it('wraps any other tag as verbatim', () => {
      assert.equal(tagNameShort('tag:example.com,2024:foo'), '!<tag:example.com,2024:foo>')
      assert.equal(
        tagNameShort('tag:example.com,2024:a!b[c]{}%'),
        '!<tag:example.com,2024:a!b[c]%7B%7D%25>'
      )
    })
  })

  it('does not throw on malformed encodings', () => {
    assert.doesNotThrow(() => tagNameShort('!\uD800'))
    assert.doesNotThrow(() => tagNameFull('!%FF'))
    assert.doesNotThrow(() => parseEvents('!%FF value'))
    assert.doesNotThrow(() => parseEvents('%TAG !e! !%FF\n--- !e!foo value'))
  })

  describe('round-trips between full and short forms', () => {
    it('tagNameShort(tagNameFull(x)) recovers the canonical short form', () => {
      assert.equal(tagNameShort(tagNameFull('!!str')), '!!str')
      assert.equal(tagNameShort(tagNameFull('!local')), '!local')
      assert.equal(tagNameShort(tagNameFull(`!<${YAML_PREFIX}seq>`)), '!!seq')
    })

    it('tagNameFull(tagNameShort(x)) recovers the resolved name', () => {
      for (const full of [`${YAML_PREFIX}str`, '!local', '!a!b', 'tag:example.com,2024:✓ é']) {
        assert.equal(tagNameFull(tagNameShort(full)), full)
      }
    })
  })
})
