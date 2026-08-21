import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  dump,
  load,
  COLLECTION_STYLE,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DUMP_SCHEMA,
  defineMappingTag,
  realMapTag,
  YAMLException
} from 'js-yaml'

describe('dump options', () => {
  it('schema — decides which plain scalars need quoting', () => {
    // The default dump schema is YAML 1.1, where `yes` is a boolean, so the
    // string must be quoted; JSON_SCHEMA has no such collision.
    assert.equal(dump('yes'), "'yes'\n")
    assert.equal(dump('yes', { schema: DUMP_SCHEMA }), "'yes'\n")
    assert.equal(dump('yes', { schema: JSON_SCHEMA }), 'yes\n')
  })

  it('skipInvalid — drops unrepresentable values instead of throwing', () => {
    assert.throws(() => dump({ a: () => 1 }), YAMLException)
    assert.equal(dump({ a: () => 1, b: 2 }, { skipInvalid: true }), 'b: 2\n')
    assert.equal(dump([() => 1, 'a'], { skipInvalid: true }), '- a\n')
  })

  it('skipInvalid — drops pairs with an unrepresentable key too', () => {
    // Plain-object keys are always strings; a real Map keeps raw keys, so the
    // key itself can be unrepresentable.
    const schema = CORE_SCHEMA.withTags(realMapTag)
    const map = new Map([[() => 1, 'x'], ['b', 2]])
    assert.throws(() => dump(map, { schema }), YAMLException)
    assert.equal(dump(map, { schema, skipInvalid: true }), 'b: 2\n')
  })

  it('noRefs — inlines repeated references instead of anchoring', () => {
    const shared = { k: 1 }

    assert.equal(dump([shared, shared]), '- &ref_0\n  k: 1\n- *ref_0\n')
    assert.equal(dump([shared, shared], { noRefs: true }), '- k: 1\n- k: 1\n')
  })

  it('indent — sets block indentation width', () => {
    assert.equal(dump({ a: { b: 1 } }), 'a:\n  b: 1\n')
    assert.equal(dump({ a: { b: 1 } }, { indent: 4 }), 'a:\n    b: 1\n')
    assert.equal(dump([{ a: 1 }], { indent: 1 }), '-\n a: 1\n')
    assert.equal(dump([{ a: 1, b: 2 }], { indent: 4 }), '-   a: 1\n    b: 2\n')
  })

  it('seqNoIndent — aligns sequence dashes with the key', () => {
    assert.equal(dump({ a: [1, 2] }), 'a:\n  - 1\n  - 2\n')
    assert.equal(dump({ a: [1, 2] }, { seqNoIndent: true }), 'a:\n- 1\n- 2\n')
  })

  it('seqInlineFirst — keeps a nested sequence on the parent dash line', () => {
    assert.equal(dump([[1, 2]]), '- - 1\n  - 2\n')
    assert.equal(dump([[1, 2]], { indent: 4 }), '-   - 1\n    - 2\n')
    assert.equal(dump([[1, 2]], { seqInlineFirst: false }), '-\n  - 1\n  - 2\n')
  })

  it('sortKeys — orders mapping keys', () => {
    assert.equal(dump({ b: 1, a: 2 }), 'b: 1\na: 2\n')
    assert.equal(dump({ b: 1, a: 2 }, { sortKeys: true }), 'a: 2\nb: 1\n')
    assert.equal(dump({ a: 1, b: 2 }, { sortKeys: true }), 'a: 1\nb: 2\n')
    assert.equal(dump({ b: 1, a: 2 }, { sortKeys: (x, y) => y.localeCompare(x) }), 'b: 1\na: 2\n')
    assert.equal(dump({ b: 1, a: 2 }, { sortKeys: () => 0 }), 'b: 1\na: 2\n')
  })

  it('sortKeys — leaves non-scalar (complex) keys in their original order', () => {
    // A complex key sorts by the key node itself; node-vs-node never compares
    // unequal, so the stable sort preserves insertion order.
    const schema = CORE_SCHEMA.withTags(realMapTag)
    const map = new Map([[{ b: 2 }, 'y'], [{ a: 1 }, 'x']])
    assert.equal(dump(map, { schema, sortKeys: true }), '? b: 2\n: y\n? a: 1\n: x\n')
  })

  it('lineWidth — wraps long scalars', () => {
    const value = { a: 'one two three four five six seven eight nine ten' }

    assert.equal(dump(value, { lineWidth: 20 }), 'a: >-\n  one two three four\n  five six seven eight\n  nine ten\n')
    assert(!dump(value).includes('\n  '))
  })

  it('quoteStyle — selects the style when quotes are needed', () => {
    assert.equal(dump('hello'), 'hello\n')
    assert.equal(dump('null', { quoteStyle: 'single' }), "'null'\n")
    assert.equal(dump('null', { quoteStyle: 'double' }), '"null"\n')
  })

  it('forceQuotes — quotes non-key strings using quoteStyle', () => {
    assert.equal(dump({ hello: 'world' }, { forceQuotes: true }), "hello: 'world'\n")
    assert.equal(
      dump({ hello: 'world' }, { forceQuotes: true, quoteStyle: 'double' }),
      'hello: "world"\n'
    )
    assert.equal(
      dump({ hello: 'world' }, { flowLevel: 0, forceQuotes: true }),
      "{hello: 'world'}\n"
    )
  })

  it('flowLevel — switches to flow style from the given depth', () => {
    assert.equal(dump({ a: [1, 2] }), 'a:\n  - 1\n  - 2\n')
    assert.equal(dump({ a: [1, 2] }, { flowLevel: 0 }), '{a: [1, 2]}\n')
    assert.equal(dump({ a: [1, 2] }, { flowLevel: 1 }), 'a: [1, 2]\n')
  })

  it('flowLevel — quotes a colon followed by a flow indicator', () => {
    // In flow context a `:` followed by a flow indicator ({ } [ ] ,) is not
    // plain-safe (ns-plain-safe-in excludes c-flow-indicator), so the value
    // must be quoted for the output to re-parse.
    for (const value of [':{', ':[', ':,', ':}', ':]', 'x:{']) {
      assert.deepStrictEqual(load(dump([value], { flowLevel: 0 })), [value])
      assert.deepStrictEqual(load(dump({ k: value }, { flowLevel: 0 })), { k: value })
    }
  })

  it('transform — mutates the generated documents before presentation', () => {
    const output = dump({ values: [1, 2] }, {
      flowLevel: 1,
      transform: documents => {
        assert.equal(documents.length, 1)
        documents[0].explicitStart = true

        const root = documents[0].contents
        assert.equal(root.kind, 'mapping')
        const values = root.items[0].value
        assert.equal(values.kind, 'sequence')
        assert.equal(values.style, COLLECTION_STYLE.FLOW) // transform runs after flowLevel
        values.items[1].value = '3'
      }
    })

    assert.equal(output, '---\nvalues: [1, 3]\n')
  })

  it('flowBracketPadding — pads inside flow brackets', () => {
    assert.equal(dump([1, 2], { flowLevel: 0 }), '[1, 2]\n')
    assert.equal(dump([1, 2], { flowLevel: 0, flowBracketPadding: true }), '[ 1, 2 ]\n')
    assert.equal(dump({ a: 1, b: 2 }, { flowLevel: 0, flowBracketPadding: true }), '{ a: 1, b: 2 }\n')
  })

  it('flowSkipCommaSpace — drops the space after flow commas', () => {
    assert.equal(dump([1, 2], { flowLevel: 0 }), '[1, 2]\n')
    assert.equal(dump([1, 2], { flowLevel: 0, flowSkipCommaSpace: true }), '[1,2]\n')
    assert.equal(dump({ a: 1, b: 2 }, { flowLevel: 0, flowSkipCommaSpace: true }), '{a: 1,b: 2}\n')
  })

  it('flowSkipColonSpace — drops the space after flow colons', () => {
    assert.equal(dump({ a: 1 }, { flowLevel: 0 }), '{a: 1}\n')
    assert.equal(dump({ a: 1 }, { flowLevel: 0, flowSkipColonSpace: true }), '{a:1}\n')
  })

  it('quoteFlowKeys — quotes keys in flow mappings', () => {
    assert.equal(dump({ a: 1 }, { flowLevel: 0 }), '{a: 1}\n')
    assert.equal(dump({ a: 1 }, { flowLevel: 0, quoteFlowKeys: true }), '{"a": 1}\n')
  })

  it('tagBeforeAnchor — emits the tag before the anchor', () => {
    function Tagged () {}
    const schema = CORE_SCHEMA.withTags(defineMappingTag('!t', {
      create: () => new Tagged(),
      addPair: (c, k, v) => { c[k] = v },
      has: () => false,
      keys: (c) => Object.keys(c),
      get: (c, k) => c[k],
      identify: (o) => o instanceof Tagged,
      represent: (o) => new Map(Object.entries(o))
    }))
    const shared = new Tagged()
    shared.x = 1

    // A shared, custom-tagged mapping carries both an anchor and a tag.
    assert.equal(dump([shared, shared], { schema }), '- &ref_0 !t\n  x: 1\n- *ref_0\n')
    assert.equal(dump([shared, shared], { schema, tagBeforeAnchor: true }), '- !t &ref_0\n  x: 1\n- *ref_0\n')
  })
})
