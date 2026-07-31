import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import util from 'node:util'
import { dump, load, CORE_SCHEMA, YAMLException, defineMappingTag, defineScalarTag, defineSequenceTag } from 'js-yaml'

function Tag1 (parameters) {
  this.x = parameters.x
  this.y = parameters.y || 0
  this.z = parameters.z || 0
}

function Tag2 () {
  Tag1.apply(this, arguments)
}
util.inherits(Tag2, Tag1)

function Tag3 () {
  Tag2.apply(this, arguments)
}
util.inherits(Tag3, Tag2)

function Foo (parameters) {
  this.myParameter = parameters.myParameter
  this.myAnotherParameter = parameters.myAnotherParameter
}

const schema = CORE_SCHEMA.withTags([
  defineMappingTag('!tag3', {
    create: () => new Tag3({}),
    addPair: (container, key, value) => {
      if (key === '=' || key === 'x') container.x = value
      else if (key === 'y') container.y = value
      else if (key === 'z') container.z = value
    },
    has: () => false,
    keys: (container) => Object.keys(container),
    get: (container, key) => container[key],
    identify: (object) => object instanceof Tag3
  }),

  defineScalarTag('!tag2', {
    resolve: (source) => new Tag2({ x: parseInt(source, 10) }),
    identify: (object) => object instanceof Tag2
  }),

  defineMappingTag('!tag1', {
    create: () => new Tag1({}),
    addPair: (container, key, value) => {
      if (key === 'x') container.x = value
      else if (key === 'y') container.y = value
      else if (key === 'z') container.z = value
    },
    has: () => false,
    keys: (container) => Object.keys(container),
    get: (container, key) => container[key],
    identify: (object) => object instanceof Tag1
  }),

  defineMappingTag('!foo', {
    create: () => new Foo({}),
    addPair: (container, key, value) => {
      if (key === 'my-parameter') container.myParameter = value
      else if (key === 'my-another-parameter') container.myAnotherParameter = value
    },
    has: () => false,
    keys: (container) => Object.keys(container),
    get: (container, key) => container[key],
    identify: (object) => object instanceof Foo
  })
])

describe('tags', () => {
  it('custom', () => {
    const src = `
- !tag1
  x: 1
- !tag1
  x: 1
  'y': 2
  z: 3
- !tag2
  10
- !tag3
  x: 1
- !tag3
  x: 1
  'y': 2
  z: 3
- !tag3
  =: 1
  'y': 2
  z: 3
- !foo
  my-parameter: foo
  my-another-parameter: [1,2,3]
`
    const expected = [
      new Tag1({ x: 1 }),
      new Tag1({ x: 1, y: 2, z: 3 }),
      new Tag2({ x: 10 }),
      new Tag3({ x: 1 }),
      new Tag3({ x: 1, y: 2, z: 3 }),
      new Tag3({ x: 1, y: 2, z: 3 }),
      new Foo({ myParameter: 'foo', myAnotherParameter: [1, 2, 3] })
    ]

    const actual = load(src, { schema })

    assert.equal(actual.length, expected.length)

    for (let i = 0; i < expected.length; i++) {
      assert.deepStrictEqual(actual[i], expected[i])
      assert.strictEqual(Object.getPrototypeOf(actual[i]), Object.getPrototypeOf(expected[i]))
    }
  })

  // One tag name registered for two node kinds; dispatch picks by node kind.
  it('custom tag with multiple node kinds', () => {
    const multiSchema = CORE_SCHEMA.withTags([
      defineScalarTag('!Include', {
        resolve: (obj) => obj
      }),
      defineMappingTag('!Include', {
        create: () => ({}),
        addPair: (container, key, value) => { container[String(key)] = value },
        has: (container, key) => Object.hasOwn(container, String(key)),
        keys: (container) => Object.keys(container),
        get: (container, key) => container[String(key)]
      })
    ])

    assert.deepStrictEqual(load('!Include foobar', { schema: multiSchema }), 'foobar')
    assert.deepStrictEqual(load('!Include\n  location: foobar', { schema: multiSchema }), { location: 'foobar' })
  })

  it('matches exact tags before tag prefixes', () => {
    const prefixTag = prefix => defineScalarTag(prefix, {
      matchByTagPrefix: true,
      resolve: (value, _isExplicit, tag) => ({ prefix, tag, value })
    })
    const prefixSchema = CORE_SCHEMA.withTags([
      prefixTag('!foo'),
      prefixTag('!'),
      defineScalarTag('!foo', { resolve: value => ({ exact: true, value }) })
    ])

    assert.deepEqual(
      load('- !foo 1\n- !foo2 2\n- !bar 3\n', { schema: prefixSchema }),
      [
        { exact: true, value: '1' },
        { prefix: '!foo', tag: '!foo2', value: '2' },
        { prefix: '!', tag: '!bar', value: '3' }
      ]
    )
  })

  for (const [nodeKind, source] of [
    ['scalar', '!<constructor> value'],
    ['sequence', '!<constructor> []'],
    ['mapping', '!<constructor> {}']
  ]) {
    it(`rejects an unknown ${nodeKind} tag named after an Object.prototype property`, () => {
      assert.throws(() => { load(source) }, error => {
        assert.ok(error instanceof YAMLException)
        assert.equal(error.reason, `unknown ${nodeKind} tag !<constructor>`)
        return true
      })
    })
  }

  it('dumps a prefix-matched tag with a dynamic name', () => {
    const dynamicSchema = CORE_SCHEMA.withTags(defineScalarTag('!', {
      matchByTagPrefix: true,
      identify: object => object?.tag !== undefined,
      representTagName: object => object.tag,
      represent: object => object.value
    }))

    assert.equal(
      dump({ test: { tag: 'foo', value: 'bar' } }, { schema: dynamicSchema }),
      'test: !<foo> bar\n'
    )
  })

  it('finalizes a sequence carrier into an immutable value', () => {
    class ImmutableSequence {
      constructor (items) {
        this.items = Object.freeze([...items])
        Object.freeze(this)
      }
    }

    const tag = defineSequenceTag('!immutable', {
      create: () => [],
      addItem: (carrier, item) => { carrier.push(item) },
      finalize: carrier => new ImmutableSequence(carrier),
      identify: value => value instanceof ImmutableSequence,
      represent: value => value.items
    })
    const immutableSchema = CORE_SCHEMA.withTags(tag)
    const value = load('{ original: &a !immutable [one, two], alias: *a }', { schema: immutableSchema })

    assert.ok(value.original instanceof ImmutableSequence)
    assert.deepStrictEqual(value.original.items, ['one', 'two'])
    assert.strictEqual(value.alias, value.original)
    assert.deepStrictEqual(load('!immutable', { schema: immutableSchema }), new ImmutableSequence([]))
    assert.equal(dump(value.original, { schema: immutableSchema }), '!immutable\n- one\n- two\n')
  })

  it('finalizes a mapping carrier before exposing it as a value', () => {
    class ImmutableMapping {
      constructor (entries) {
        this.entries = new Map(entries)
        Object.freeze(this)
      }
    }

    const immutableSchema = CORE_SCHEMA.withTags(defineMappingTag('!immutable', {
      create: () => new Map(),
      addPair: (carrier, key, value) => { carrier.set(key, value); return '' },
      has: (carrier, key) => carrier.has(key),
      keys: result => result.entries.keys(),
      get: (result, key) => result.entries.get(key),
      finalize: carrier => new ImmutableMapping(carrier),
      identify: value => value instanceof ImmutableMapping,
      represent: value => value.entries
    }))
    const value = load('!immutable { one: 1, two: 2 }', { schema: immutableSchema })

    assert.ok(value instanceof ImmutableMapping)
    assert.deepStrictEqual([...value.entries], [['one', 1], ['two', 2]])
    assert.equal(dump(value, { schema: immutableSchema }), '!immutable\none: 1\ntwo: 2\n')
  })

  it('rejects recursive aliases when the carrier is not the result', () => {
    const immutableSchema = CORE_SCHEMA.withTags(defineSequenceTag('!immutable', {
      create: () => [],
      addItem: (carrier, item) => { carrier.push(item) },
      finalize: carrier => Object.freeze([...carrier]),
      identify: Array.isArray,
      represent: value => value
    }))

    assert.throws(
      () => load('&a !immutable [*a]', { schema: immutableSchema }),
      /recursive alias "a" is not supported for tag !immutable because it uses finalize\(\)/
    )
    assert.throws(
      () => load('&a !immutable [&b [*a]]', { schema: immutableSchema }),
      /recursive alias "a" is not supported for tag !immutable because it uses finalize\(\)/
    )
  })

  it('reports finalize errors at the collection start', () => {
    const immutableSchema = CORE_SCHEMA.withTags(defineSequenceTag('!immutable', {
      create: () => [],
      addItem: (carrier, item) => { carrier.push(item) },
      finalize: () => { throw new Error('cannot create immutable value') },
      identify: Array.isArray,
      represent: value => value
    }))

    assert.throws(
      () => load('root:\n  !immutable [one]', { schema: immutableSchema, filename: 'example.yml' }),
      error => {
        assert.ok(error instanceof YAMLException)
        assert.equal(error.reason, 'cannot create immutable value')
        assert.equal(error.mark.name, 'example.yml')
        assert.equal(error.mark.line, 1)
        assert.equal(error.mark.column, 2)
        return true
      }
    )
  })

  it('preserves YAMLException thrown by finalize', () => {
    const expected = new YAMLException('cannot create immutable value')
    const immutableSchema = CORE_SCHEMA.withTags(defineSequenceTag('!immutable', {
      create: () => [],
      addItem: () => {},
      finalize: () => { throw expected },
      identify: Array.isArray,
      represent: value => value
    }))

    assert.throws(() => load('!immutable []', { schema: immutableSchema }), error => error === expected)
  })

  it('reports non-Error values thrown by finalize', () => {
    const immutableSchema = CORE_SCHEMA.withTags(defineSequenceTag('!immutable', {
      create: () => [],
      addItem: () => {},
      finalize: () => { throw 'cannot create immutable value' }, // eslint-disable-line no-throw-literal
      identify: Array.isArray,
      represent: value => value
    }))

    assert.throws(
      () => load('!immutable []', { schema: immutableSchema }),
      error => error instanceof YAMLException && error.reason === 'cannot create immutable value'
    )
  })

  it('keeps recursive aliases for tags whose carrier is the result', () => {
    const value = load('&a [*a]')

    assert.strictEqual(value[0], value)
  })

  it('does not call the placeholder finalizer when the carrier is the result', () => {
    const tag = defineSequenceTag('!identity', {
      create: () => [],
      addItem: (carrier, item) => { carrier.push(item) }
    })
    tag.finalize = () => { throw new Error('placeholder finalizer was called') }

    assert.deepStrictEqual(load('!identity [one]', { schema: CORE_SCHEMA.withTags(tag) }), ['one'])
  })
})
