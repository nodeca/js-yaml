import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  dump,
  load,
  defineScalarTag,
  parseEvents,
  jsToAst,
  eventsToAst,
  present,
  CORE_SCHEMA,
  nullCoreTag,
  realMapTag
} from 'js-yaml'

function presentParsed (input) {
  const events = parseEvents(input, {})
  return present(eventsToAst(events, { source: input, schema: CORE_SCHEMA }), { schema: CORE_SCHEMA })
}

describe('ast presenter', () => {
  it('keeps quoteFlowKeys outside an explicit long flow key', () => {
    const key = `${'a'.repeat(1024)}\nb`
    const documents = jsToAst({ [key]: 'value' }, CORE_SCHEMA)
    const node = documents[0].contents

    assert.equal(node?.kind, 'mapping')
    node.style.flow = true

    const output = present(documents, { schema: CORE_SCHEMA, quoteFlowKeys: true })

    assert.equal(output, `{? "${'a'.repeat(1024)}\\nb": value}\n`)
    assert.deepEqual(load(output, { schema: CORE_SCHEMA }), { [key]: 'value' })
  })

  it('aligns a compact block-collection key with a wide indent', () => {
    const map = new Map([[[1, 2], new Map([['a', 1], ['b', 2]])]])
    const schema = CORE_SCHEMA.withTags(realMapTag)
    const output = dump(map, { schema, indent: 4 })

    assert.equal(output, '?   - 1\n    - 2\n:   a: 1\n    b: 2\n')
    assert.deepEqual(load(output, { schema }), map)
  })

  it('drops the indicator space when a block-collection key wraps at indent 1', () => {
    const map = new Map([[[1, 2], new Map([['a', 1], ['b', 2]])]])
    const schema = CORE_SCHEMA.withTags(realMapTag)
    const output = dump(map, { schema, indent: 1 })

    assert.equal(output, '?\n - 1\n - 2\n:\n a: 1\n b: 2\n')
    assert.deepEqual(load(output, { schema }), map)
  })

  it('keeps equal sortKeys keys in their original order', () => {
    // Two keys that compare equal exercise the comparator's tie branch; a stable
    // sort leaves them as-is.
    const documents = jsToAst({ a: 1, b: 2 }, CORE_SCHEMA)
    const node = documents[0].contents
    node.items[1].key.value = 'a'

    const output = present(documents, { schema: CORE_SCHEMA, sortKeys: true })

    assert.equal(output, 'a: 1\na: 2\n')
  })

  it('emits a bare marker for an explicit-start null document', () => {
    const output = present([{ contents: null, directives: [], explicitStart: true }], { schema: CORE_SCHEMA })

    assert.equal(output, '---\n')
  })

  it('prints document directives before the document marker', () => {
    const documents = jsToAst('bar', CORE_SCHEMA)
    documents[0].directives = [
      { kind: 'yaml', version: '1.2' },
      { kind: 'tag', handle: '!e!', prefix: 'tag:example.com,2024:' }
    ]
    const output = present(documents, { schema: CORE_SCHEMA })

    assert.equal(output, '%YAML 1.2\n%TAG !e! tag:example.com,2024:\n---\nbar\n')
  })

  it('keeps explicit parsed tag spelling', () => {
    assert.equal(presentParsed('!!str 123\n'), '!!str 123\n')
    assert.equal(presentParsed('!!%73tr 123\n'), '!!%73tr 123\n')
    assert.equal(presentParsed('!<tag:yaml.org,2002:str> 123\n'), '!<tag:yaml.org,2002:str> 123\n')
    assert.equal(presentParsed('! 123\n'), '! 123\n')
  })

  it('keeps explicit parsed tag handles with directives', () => {
    const input = '%TAG !e! tag:example.com,2024:\n--- !e!foo bar\n'

    assert.equal(presentParsed(input), '%TAG !e! tag:example.com,2024:\n---\n!e!foo bar\n')
  })

  it('prints explicit from_js tags in printable form', () => {
    const customTag = defineScalarTag('!custom', {
      resolve: source => source,
      identify: object => object && object.custom === true,
      represent: object => object.value
    })
    const schema = CORE_SCHEMA.withTags(customTag)

    assert.equal(dump({ custom: true, value: 'ok' }, { schema }), '!custom ok\n')
    assert.equal(dump(new Uint8Array([1, 2, 3])), '!!binary AQID\n')
  })

  it('renders an empty scalar without a trailing space', () => {
    // null tag whose represent renders nothing — `key:` / `- ` with no value.
    const schema = CORE_SCHEMA.withTags({ ...nullCoreTag, represent: () => '' })

    // null → '' in a mapping / sequence: `a:` / `- a:`, never `a: ` / `- a: `.
    assert.equal(dump({ a: null }, { schema }), 'a:\n')
    assert.equal(dump([{ a: null }], { schema }), '- a:\n')

    // A real empty string stays quoted, distinct from null/empty.
    assert.equal(dump({ a: '' }, { schema }), "a: ''\n")
  })

  it('applies flow recursively to descendants', () => {
    const documents = jsToAst([{ a: [1, 2], b: 'x\ny' }], CORE_SCHEMA)
    const node = documents[0].contents
    node.style.flow = true // only the outer sequence

    // Nested collections render flow despite their own block style, and a
    // multiline scalar can't stay block inside flow — it falls back to quoting.
    assert.equal(present(documents, { schema: CORE_SCHEMA }), '[{a: [1, 2], b: "x\\ny"}]\n')
  })

  it('keeps a tab-indented line in a folded scalar more-indented', () => {
    const longTab = `\t${'word '.repeat(20).trim()}`
    const spacedTab = `${'a'.repeat(90)} \tzzz`

    // [source, value] — every source is already the canonical rendering of its
    // value, so re-presenting it must reproduce it byte for byte.
    const cases = [
      // tab-indented line first, last, and between two folded lines
      ['k: >\n  \t\n  detected\n', '\t\ndetected\n'],
      ['k: >\n  detected\n  \tdeep\n', 'detected\n\tdeep\n'],
      ['k: >\n  a\n  \tdeep\n  b\n', 'a\n\tdeep\nb\n'],
      // over the line width, but a more-indented line is never folded
      [`k: >\n  ${longTab}\n  tail\n`, `${longTab}\ntail\n`],
      // folding here would start the next line with a tab, changing the value
      [`k: >\n  ${spacedTab}\n`, `${spacedTab}\n`],
      // controls: literal style and space indentation were always correct
      ['k: |\n  a\n  \tdeep\n  b\n', 'a\n\tdeep\nb\n'],
      ['k: >\n  a\n   deep\n  b\n', 'a\n deep\nb\n']
    ]

    for (const [source, value] of cases) {
      assert.deepEqual(load(source, { schema: CORE_SCHEMA }), { k: value })
      assert.equal(presentParsed(source), source)
    }
  })

  it('propagates seqNoIndent to nested sequences', () => {
    const documents = jsToAst([{ items: [{ a: 1 }] }], CORE_SCHEMA)

    // The deeper `items` sequence keeps its dashes aligned with the key too,
    // not just the top-level one.
    assert.equal(present(documents, { schema: CORE_SCHEMA }), '- items:\n    - a: 1\n')
    assert.equal(present(documents, { schema: CORE_SCHEMA, seqNoIndent: true }), '- items:\n  - a: 1\n')
  })
})
