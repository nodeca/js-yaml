import { describe, it } from 'node:test'

import assert from 'node:assert'
import { dump, load } from 'js-yaml'

// Indents lines by 2 spaces. Empty lines (\n only) are not indented.
function indent (string) {
  return string.replace(/^.+/gm, '  ' + '$&')
}

function getLength (s) {
  return s.length
}

// Repeats a string n times.
function repeat (string, n) {
  return (new Array(n + 1)).join(string)
}

describe('Scalar style dump:', () => {
  describe('Plain style', () => {
    it('is preferred', () => {
      ['plain',
        'hello world',
        'pizza 3.14159',
        // cannot be misinterpreted as a number
        '127.0.0.1',
        // quotes are allowed after the first character
        'quoted"scalar',
        'here\'s to "quotes"',
        // additional allowed characters
        '100% safe non-first characters? Of course!',
        'Jack & Jill <well@example.com>',
        // astral code points advance as one character in the plain-style loop
        '😃😊'
      ].forEach((string) => {
        assert.strictEqual(dump(string), `${string}\n`)
      })
    })
  })

  describe('Single- and double-quoted styles', () => {
    it('handles strings resembling YAML structural tokens', () => {
      const cases = [
        // Document boundary markers, including a following plain scalar.
        ['---', "'---'\n"],
        ['...', "'...'\n"],
        ['--- x', "'--- x'\n"],
        ['... x', "'... x'\n"],
        // Similar strings that are not document markers stay plain.
        ['---x', '---x\n'],
        ['...x', '...x\n'],
        ['....', '....\n'],
        ['x...', 'x...\n'],
        // Block sequence/mapping indicators followed by separation whitespace.
        ['- value', "'- value'\n"],
        ['? value', "'? value'\n"],
        ['=', "'='\n"],
        // A colon is plain-safe unless followed by whitespace or at the end.
        ['http://example.com', 'http://example.com\n'],
        ['foo: bar', "'foo: bar'\n"],
        ['foo:', "'foo:'\n"],
        // A hash starts a comment only after separation whitespace.
        ['foo#bar', 'foo#bar\n'],
        ['foo #bar', "'foo #bar'\n"]
      ]

      for (const [string, expected] of cases) {
        assert.strictEqual(dump(string), expected)
        assert.strictEqual(load(expected), string)
      }
    })

    it('quote strings of ambiguous type', () => {
      assert.strictEqual(dump('Yes'), '\'Yes\'\n')
      assert.strictEqual(dump('true'), '\'true\'\n')
      assert.strictEqual(dump('42'), '\'42\'\n')
      assert.strictEqual(dump('99.9'), '\'99.9\'\n')
      assert.strictEqual(dump('127.0001'), '\'127.0001\'\n')
      assert.strictEqual(dump('1.23015e+3'), '\'1.23015e+3\'\n')
    })

    it('quote leading/trailing whitespace', () => {
      assert.strictEqual(dump(' leading space'), '\' leading space\'\n')
      assert.strictEqual(dump('trailing space '), '\'trailing space \'\n')
    })

    it('quote leading quotes', () => {
      assert.strictEqual(dump("'singles double'"), "'''singles double'''\n")
      assert.strictEqual(dump('"single double'), '\'"single double\'\n')
    })

    it('escape \\ and " in double-quoted', () => {
      assert.strictEqual(dump('\u0007 escape\\ escaper"'), '"\\a escape\\\\ escaper\\""\n')
    })

    it('escape non-printables', () => {
      assert.strictEqual(dump('a\nb\u0001c'), '"a\\nb\\x01c"\n')
      // BOM sits in the printable range but is excluded, so it must be escaped.
      assert.strictEqual(dump('a﻿b'), '"a\\uFEFFb"\n')
    })

    it('emits astral (surrogate-pair) characters as a single code point', () => {
      // Printable, so kept verbatim — but the pair must advance as one code
      // point both when choosing the style and when escaping.
      assert.strictEqual(
        dump('\u{1F600}', { quoteStyle: 'double', forceQuotes: true }),
        '"\u{1F600}"\n'
      )
    })

    it('quotes an empty scalar with double quotes under quoteStyle: double', () => {
      assert.strictEqual(dump('', { quoteStyle: 'double' }), '""\n')
    })
  })

  describe('Literal style', () => {
    const content = 'a\nb \n\n c\n  d'
    const indented = indent(content)

    it('preserves trailing newlines using chomping', () => {
      assert.strictEqual(dump({ a: '\n', b: '\n\n', c: 'c\n', d: 'd\nd' }),
        'a: |+\n\nb: |+\n\n\nc: |\n  c\nd: |-\n  d\n  d\n')
      assert.strictEqual(dump('\n'), '|+\n' + '\n...\n')
      assert.strictEqual(dump('\n\n'), '|+\n' + '\n\n...\n')

      assert.strictEqual(dump(content), `|-\n${indented}\n`)
      assert.strictEqual(dump(`${content}\n`), `|\n${indented}\n`)
      assert.strictEqual(dump(`${content}\n\n`), `|+\n${indented}\n\n...\n`)
      assert.strictEqual(dump(`${content}\n\n\n`), `|+\n${indented}\n\n\n...\n`)
    })

    it('accepts leading whitespace', () => {
      assert.strictEqual(dump(`   ${content}`), `|3-\n   ${indented}\n`)
    })

    it('falls back to quoting when required indent indicator is too large', () => {
      assert.strictEqual(dump(' these go\nup to\neleven', { indent: 11 }),
        '" these go\\nup to\\neleven"\n')
    })
  })

  describe('Folded style', () => {
    (() => {
      const content = (() => {
        let result = ''
        let i = 1000
        for (let para = 1; para <= 7; para++) {
          result += '\n'
          // indent paragraphs 3 and 4
          if (para === 3 || para === 4) {
            result += repeat(' ', para)
          }
          // vary the number of words on the last line
          for (let count = 2 * (30 / 5) + para - 1; count > 0; count--) {
            result += i + ' '
            if (i % 17 === 0) result += ' '
            i++
          }
        }
        return result
      })()
      const wrapped = '\n' +
        '1000 1001 1002 1003  1004 1005\n' +
        '1006 1007 1008 1009 1010 1011 \n' +
        '\n' +
        '1012 1013 1014 1015 1016 1017\n' +
        '1018 1019 1020  1021 1022 1023\n' +
        '1024 \n' +
        '   1025 1026 1027 1028 1029 1030 1031 1032 1033 1034 1035 1036 1037  1038 \n' +
        '    1039 1040 1041 1042 1043 1044 1045 1046 1047 1048 1049 1050 1051 1052 1053 \n' +
        '1054  1055 1056 1057 1058 1059\n' +
        '1060 1061 1062 1063 1064 1065\n' +
        '1066 1067 1068 1069 \n' +
        '\n' +
        '1070 1071  1072 1073 1074 1075\n' +
        '1076 1077 1078 1079 1080 1081\n' +
        '1082 1083 1084 1085 1086 \n' +
        '\n' +
        '1087 1088  1089 1090 1091 1092\n' +
        '1093 1094 1095 1096 1097 1098\n' +
        '1099 1100 1101 1102 1103 1104 '
      const indented = indent(wrapped)

      function dumpNarrow (s) {
        return dump(s, { lineWidth: 30 + 2 })
      }

      it('wraps lines and ignores more-indented lines ', () => {
        assert.strictEqual(dumpNarrow(content), `>-\n${indented}\n`)
      })

      it('preserves trailing newlines using chomping', () => {
        assert.strictEqual(dumpNarrow(`${content}\n`), `>\n${indented}\n`)
        assert.strictEqual(dumpNarrow(`${content}\n\n`), `>+\n${indented}\n\n...\n`)
        assert.strictEqual(dumpNarrow(`${content}\n\n\n`), `>+\n${indented}\n\n\n...\n`)
      })
    })()

    // Dump and check that dump-then-load preserves content (is the identity function).
    function dumpAndLoad (input, opts) {
      const output = dump(input, opts)
      assert.strictEqual(load(output), input, 'Dump then load should preserve content')
      return output
    }

    it('should not cut off a long word at the start of a line', () => {
      assert.strictEqual(dumpAndLoad('123\n' + repeat('1234567890', 9) + ' hello\ngoodbye'),
        '>-\n' + indent(
          '123\n' +
          '\n' +
          repeat('1234567890', 9) + '\n' +
          'hello\n' +
          '\n' +
          'goodbye\n'))
    })

    it('preserves consecutive spaces', () => {
      const alphabet = 'a bc  def  ghi' + repeat(' ', 70) + 'jk  lmn o\n' +
        ' p  qrstu     v' + repeat(' ', 80) + '\nw x\n' + 'yz  '
      assert.strictEqual(dumpAndLoad(alphabet),
        '>-\n' + indent(
          'a bc  def \n' +
          'ghi' + repeat(' ', 70) + 'jk \n' +
          'lmn o\n' +
          ' p  qrstu     v' + repeat(' ', 80) + '\n' +
          'w x\n' +
          '\n' +
          'yz  \n'))

      const indeed = repeat('word. ', 31) + '\n' +
        [2, 3, 5, 7, 11, 13, 17]
          .map((n) => { return repeat(' ', n) })
          .join('\n')
      assert.strictEqual(dumpAndLoad(indeed),
        '>-\n' + indent(
          'word. word. word. word. word. word. word. word. word. word. word. word. word.\n' +
          'word. word. word. word. word. word. word. word. word. word. word. word. word.\n' +
          'word. word. word. word. word. \n' +
          [2, 3, 5, 7, 11, 13, 17]
            .map((n) => { return repeat(' ', n) })
            .join('\n') + '\n'))
    })

    const story = 'Call me Ishmael. Some years ago—never mind how long precisely—' +
      'having little or no money in my purse, ' +
      'and nothing particular to interest me on shore, ' +
      'I thought I would sail about a little and see the watery part of the world...'
    const prefix = 'var short_story = "",'
    const line = 'longer_story = "' + story + '";'

    it('should fold a long last line missing an ending newline', () => {
      const content = [prefix, line].join('\n')

      const lengths = dumpAndLoad(content).split('\n').map(getLength)
      assert.deepStrictEqual(lengths, [2, 23, 0, 69, 76, 80, 24, 0])
    })

    it('should not fold a more-indented last line', function functionName () {
      const content = [prefix, line, '    ' + line].join('\n')

      const lengths = dumpAndLoad(content).split('\n').map(getLength)
      assert.deepStrictEqual(lengths, [2, 23, 0, 69, 76, 80, 24, 250, 0])
    })

    it('should not fold when lineWidth === -1', () => {
      const content = [prefix, line, line + line, line].join('\n')

      assert.strictEqual(dumpAndLoad(content, { lineWidth: -1 }), '|-\n' + indent(content) + '\n')
    })

    it('falls back to literal style when no lines are foldable', () => {
      const content = [prefix, '    ' + line, '    ' + line].join('\n')

      assert.strictEqual(dumpAndLoad(content), '|-\n' + indent(content) + '\n')
    })
  })
})
