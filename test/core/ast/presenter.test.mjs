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
  COLLECTION_STYLE,
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
    node.style = COLLECTION_STYLE.FLOW

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
    node.style = COLLECTION_STYLE.FLOW // only the outer sequence

    // Nested collections render flow despite their own block style, and a
    // multiline scalar can't stay block inside flow — it falls back to quoting.
    assert.equal(present(documents, { schema: CORE_SCHEMA }), '[{a: [1, 2], b: "x\\ny"}]\n')
  })

  // [source, value] — every source is already the canonical rendering of its
  // value, so re-presenting it must reproduce it byte for byte.

  it('keeps a tab-indented line in a folded scalar more-indented', () => {
    const cases = [
      // tab-indented line first, last, and between two folded lines
      ['k: >\n  \t\n  detected\n', '\t\ndetected\n'],
      ['k: >\n  detected\n  \tdeep\n', 'detected\n\tdeep\n'],
      ['k: >\n  a\n  \tdeep\n  b\n', 'a\n\tdeep\nb\n'],
      // controls: literal style and space indentation were always correct
      ['k: |\n  a\n  \tdeep\n  b\n', 'a\n\tdeep\nb\n'],
      ['k: >\n  a\n   deep\n  b\n', 'a\n deep\nb\n']
    ]

    for (const [source, value] of cases) {
      assert.deepEqual(load(source, { schema: CORE_SCHEMA }), { k: value })
      assert.equal(presentParsed(source), source)
    }
  })

  it('never folds a tab-indented line over the width limit', () => {
    const longTab = `\t${'word '.repeat(20).trim()}`
    const source = `k: >\n  ${longTab}\n  tail\n`

    assert.deepEqual(load(source, { schema: CORE_SCHEMA }), { k: `${longTab}\ntail\n` })
    assert.equal(presentParsed(source), source)
  })

  it('does not fold a folded scalar at a space before a tab', () => {
    // Folding here would start the next line with a tab, changing the value.
    const spacedTab = `${'a'.repeat(90)} \tzzz`
    const source = `k: >\n  ${spacedTab}\n`

    assert.deepEqual(load(source, { schema: CORE_SCHEMA }), { k: `${spacedTab}\n` })
    assert.equal(presentParsed(source), source)
  })

  // The presenter re-derives the block header and the fold points from the value,
  // so a slip there silently changes the value instead of the formatting.
  // Bytes aren't asserted — a source may legitimately use a form the presenter
  // wouldn't pick (`>2` vs `>`); values have no such exceptions.
  // Alphabet = one char per branch of getBlockValue(); the stretched copy is what
  // pushes lines over the width limit, the only place folding happens.
  it('preserves block scalar values through an AST round-trip', () => {
    let bodies = ['']
    let sweep = []

    for (let length = 0; length < 4; length++) {
      bodies = bodies.flatMap(body => ['a', ' ', '\t', '\n'].map(char => body + char))
      sweep = sweep.concat(bodies)
    }

    sweep = sweep.concat(sweep.map(body => body.replaceAll('a', 'a'.repeat(90))))

    let checked = 0

    for (const body of sweep) {
      for (const header of ['|', '|-', '|+', '>', '>-', '>+']) {
        const indented = body.split('\n').map(line => line === '' ? '' : `  ${line}`).join('\n')
        const source = `k: ${header}\n${indented}\n`
        let value

        // Not every generated body makes a valid scalar.
        try {
          value = load(source, { schema: CORE_SCHEMA })
        } catch {
          continue
        }

        checked++
        assert.deepEqual(load(presentParsed(source), { schema: CORE_SCHEMA }), value, JSON.stringify(source))
      }
    }

    // Guards against the sweep quietly emptying out and passing on nothing.
    assert.ok(checked > 1000, `only ${checked} sources parsed`)
  })

  it('propagates seqNoIndent to nested sequences', () => {
    const documents = jsToAst([{ items: [{ a: 1 }] }], CORE_SCHEMA)

    // The deeper `items` sequence keeps its dashes aligned with the key too,
    // not just the top-level one.
    assert.equal(present(documents, { schema: CORE_SCHEMA }), '- items:\n    - a: 1\n')
    assert.equal(present(documents, { schema: CORE_SCHEMA, seqNoIndent: true }), '- items:\n  - a: 1\n')
  })
})
