import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { load, CORE_SCHEMA, YAML11_SCHEMA, mergeTag } from 'js-yaml'

describe('tags/merge', () => {
  it('common', () => {
    const src = `
- &CENTER { x: 1, 'y': 2 }
- &LEFT { x: 0, 'y': 2 }
- &BIG { r: 10 }
- &SMALL { r: 1 }

- x: 1
  'y': 2
  r: 10
  label: center/big

- << : *CENTER
  r: 10
  label: center/big

- << : [ *CENTER, *BIG ]
  label: center/big

- << : [ *BIG, *LEFT, *SMALL ]
  x: 1
  label: center/big
`
    const expected = [
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { r: 10 },
      { r: 1 },
      { x: 1, y: 2, r: 10, label: 'center/big' },
      { x: 1, y: 2, r: 10, label: 'center/big' },
      { x: 1, y: 2, r: 10, label: 'center/big' },
      { x: 1, y: 2, r: 10, label: 'center/big' }
    ]

    assert.deepStrictEqual(
      load(src, { schema: CORE_SCHEMA.withTags(mergeTag) }),
      expected
    )
  })

  it('duplicated merge keys', () => {
    const src = `
---
<<: {x: 1, y: 2}
foo: bar
<<: {z: 3, t: 4}
`
    const expected = { x: 1, y: 2, foo: 'bar', z: 3, t: 4 }

    assert.deepStrictEqual(
      load(src, { schema: CORE_SCHEMA.withTags(mergeTag) }),
      expected
    )
  })

  it('throws when the target mapping tag rejects a merged pair', () => {
    const src = `
--- !!set
<<: { a: 1 }
`
    assert.throws(() => load(src, { schema: YAML11_SCHEMA }), /cannot resolve a set item/)
  })

  it('throws on a non-mapping merge source', () => {
    const src = `
foo: bar
<<: baz
`
    assert.throws(
      () => load(src, { schema: CORE_SCHEMA.withTags(mergeTag) }),
      /cannot merge mappings/
    )
  })

  it('throws on a non-mapping item in a merge sequence', () => {
    const src = `
foo: bar
<<: [x: 1, y: 2, z, t: 4]
`
    assert.throws(
      () => load(src, { schema: CORE_SCHEMA.withTags(mergeTag) }),
      /cannot merge mappings/
    )
  })

  it('throws on a string item in an aliased merge sequence', () => {
    const src = `
a: &x [abc]
<<: *x
`
    assert.throws(() => load(src, { schema: YAML11_SCHEMA }), /cannot merge mappings/)
  })

  it('throws on a sequence item in an aliased merge sequence', () => {
    const src = `
a: &x [[p, q]]
<<: *x
`
    assert.throws(() => load(src, { schema: YAML11_SCHEMA }), /cannot merge mappings/)
  })

  it('merges an aliased source', () => {
    assert.deepStrictEqual(
      load('a: &x {p: 1}\n<<: *x\n', { schema: YAML11_SCHEMA }),
      { a: { p: 1 }, p: 1 }
    )
    assert.deepStrictEqual(
      load('a: &x [{p: 1}]\n<<: *x\n', { schema: YAML11_SCHEMA }),
      { a: [{ p: 1 }], p: 1 }
    )
  })

  // `!!set` is a mapping in YAML terms, but its constructed value is a `Set`,
  // so a merge item must be read with its own tag (`!!map` here) instead of the
  // target's.
  it('merges a sequence source when target and item mapping tags differ', () => {
    const src = `
--- !!set
<<: [ { a: null } ]
`
    assert.deepStrictEqual(load(src, { schema: YAML11_SCHEMA }), new Set(['a']))
  })

  describe('`<<` outside of a mapping key', () => {
    it('as a mapping value', () => {
      assert.deepStrictEqual(load('foo: <<\n', { schema: YAML11_SCHEMA }), { foo: '<<' })
    })

    it('as a sequence item', () => {
      assert.deepStrictEqual(load('- <<\n', { schema: YAML11_SCHEMA }), ['<<'])
    })

    it('as a document root', () => {
      assert.deepStrictEqual(load('<<\n', { schema: YAML11_SCHEMA }), '<<')
    })

    it('inside a nested mapping', () => {
      assert.deepStrictEqual(load('a: {b: <<}\n', { schema: YAML11_SCHEMA }), { a: { b: '<<' } })
    })

    it('as an explicit !!merge tag on an empty node', () => {
      assert.deepStrictEqual(load('foo: !!merge\n', { schema: YAML11_SCHEMA }), { foo: '<<' })
    })

    it('quoted, never a merge key', () => {
      assert.deepStrictEqual(load('foo: "<<"\n', { schema: YAML11_SCHEMA }), { foo: '<<' })
    })

    it('still merges in the key position', () => {
      assert.deepStrictEqual(load('<<: {p: 1}\n', { schema: YAML11_SCHEMA }), { p: 1 })
    })
  })

  it('Resolving explicit !!merge on empty node', () => {
    assert.doesNotThrow(() => load('? !!merge\n: []', { schema: CORE_SCHEMA.withTags(mergeTag) }))
  })
})
