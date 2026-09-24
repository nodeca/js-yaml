import { describe, it } from 'node:test'

import assert from 'node:assert'
import { load, loadAll, YAMLException } from 'js-yaml'

const samples = [
  {
    name: 'duplicate tag directive',
    source: `%TAG    !foo!   bar
%TAG    !foo!   baz
--- foo
`
  },
  {
    name: 'invalid starting character',
    source: '@@@@@@@@@@@@@@@@@@@\n'
  },
  {
    name: 'null byte in input',
    source: 'foo\0bar'
  },
  {
    name: 'expected scalar',
    source: '--- !!str [not a scalar]\n'
  },
  {
    name: 'invalid directive name',
    source: `%   # no name at all
---
`
  },
  {
    name: 'invalid escape numbers',
    source: String.raw`"hm.... \u123?"` + '\n'
  },
  {
    name: 'invalid anchor in flow collection',
    source: `---
- [
    &correct foo,
    *correct,
    *correct]   # still correct
- *correct: still correct
- &correct-or-not[foo, bar]
`
  },
  {
    name: 'duplicate anchor property',
    source: '&a &b v'
  },
  {
    name: 'empty anchor name',
    source: '& [x]'
  },
  {
    name: 'empty alias name',
    source: '*'
  },
  {
    name: 'invalid tag directive handle',
    source: `%TAG !!! !!!
---
`
  },
  {
    name: 'invalid tag handle',
    source: `%TAG    foo bar
---
`
  },
  {
    name: 'invalid tag directive argument count',
    source: `%TAG !e!
---
x
`
  },
  {
    name: 'invalid tag directive prefix',
    source: `%TAG !e! []
---
x
`
  },
  {
    name: 'invalid uri escapes',
    source: '--- !<tag:%x?y> foo\n'
  },
  {
    name: 'unterminated verbatim tag',
    source: '!<foo bar'
  },
  {
    name: 'duplicate tag property',
    source: '!!str !foo bar'
  },
  {
    name: 'invalid named tag handle',
    source: '!foo_bar!x v'
  },
  {
    name: 'exclamation mark inside tag suffix',
    source: '!foo!bar!baz v'
  },
  {
    name: 'invalid yaml version',
    source: `%YAML   2.0
--- foo
`
  },
  {
    name: 'no flow mapping end',
    source: '{ foo: bar ]\n'
  },
  {
    name: 'no node in nested flow collection',
    source: '- [ !foo } ]\n'
  },
  {
    name: 'no node with explicit tag',
    source: '- !foo ]\n'
  },
  {
    name: 'unclosed quoted scalar',
    source: `'foo
 bar
`
  },
  {
    name: 'unclosed double quoted scalar',
    source: '"foo'
  },
  {
    name: 'repeated block chomping marker',
    source: '|++\n'
  },
  {
    name: 'repeated block indentation width',
    source: '|11\n'
  },
  {
    name: 'undefined anchor',
    source: `- foo
- &bar baz
- *bat
`
  },
  {
    name: 'no whitespace after key-value separator',
    source: '"foo":bar\n'
  },
  {
    name: 'tab indentation in a later block sequence entry',
    source: ' - foo\n \t- bar\n'
  }
]

describe('load errors', () => {
  for (const sample of samples) {
    it(sample.name, () => {
      assert.throws(() => {
        loadAll(
          sample.source,
          () => {},
          { filename: `${sample.name}.yml` }
        )
      }, YAMLException)
    })
  }

  it('forbid non-printable characters', () => {
    assert.throws(() => { load('\x01') }, YAMLException)
    assert.throws(() => { load('\x7f') }, YAMLException)
    assert.throws(() => { load('\x9f') }, YAMLException)
  })

  it('forbid non-printable characters inside plain scalars', () => {
    assert.throws(() => { load('key: val\x80ue') }, YAMLException)
    assert.throws(() => { load('key: \x80abc') }, YAMLException)
    assert.throws(() => { load('key: \x80a b') }, YAMLException)
    assert.throws(() => { load('key: a\x7fb') }, YAMLException)
    assert.throws(() => { load('key: a\x01b') }, YAMLException)
    assert.throws(() => { load('key: abc\n  d\x80ef') }, YAMLException)
    assert.throws(() => { load('[a\x80b]') }, YAMLException)
  })

  it('points non-printable character errors at the offending character', () => {
    function assertMark (source, line, column) {
      assert.throws(() => { load(source) }, error => {
        assert.ok(error instanceof YAMLException)
        assert.equal(error.mark.line, line)
        assert.equal(error.mark.column, column)
        return true
      })
    }

    assertMark('a: b\x01\nc: d', 0, 4)
    assertMark('a: b\x01\n  c', 0, 4)
    assertMark('a: |\n  x\x01\n  y\n', 1, 3)
    assertMark('a: x\udc00', 0, 4)
  })

  it('forbid flow indicators at the start of block plain scalars', () => {
    assert.throws(() => { load('k: ]') }, YAMLException)
    assert.throws(() => { load('k: }') }, YAMLException)
    assert.throws(() => { load('k: ,x') }, YAMLException)
    assert.throws(() => { load('- ]') }, YAMLException)
    assert.throws(() => { load(']') }, YAMLException)
    assert.throws(() => { load(']: v') }, YAMLException)

    assert.deepStrictEqual(load('k: a]'), { k: 'a]' })
    assert.deepStrictEqual(load('k: a,b'), { k: 'a,b' })
    assert.deepStrictEqual(load('- -]'), ['-]'])
    assert.deepStrictEqual(load('k: [a]'), { k: ['a'] })
    assert.deepStrictEqual(load('k: {a: b}'), { k: { a: 'b' } })
  })

  it('forbid lone surrogates', () => {
    assert.throws(() => { load('\udc00\ud800') }, YAMLException)
  })

  it('forbid control sequences inside quoted scalars', () => {
    assert.throws(() => { load("'\x03'") }, YAMLException)
    assert.throws(() => { load('"\x03"') }, YAMLException)
  })

  it('tracks error position after CRLF line breaks', () => {
    assert.throws(() => {
      load('a: 1\r\n@', { filename: 'crlf-error.yml' })
    }, error => {
      assert.ok(error instanceof YAMLException)
      assert.equal(error.mark.name, 'crlf-error.yml')
      assert.equal(error.mark.line, 1)
      assert.equal(error.mark.column, 0)
      return true
    })
  })
})
