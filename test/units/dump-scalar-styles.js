'use strict';

var assert = require('assert');
var yaml   = require('../..');

// Indents lines by 2 spaces. Empty lines (\n only) are not indented.
function indent(string) {
  return string.replace(/^.+/gm, '  ' + '$&');
}

function getLength(s) {
  return s.length;
}

// Repeats a string n times.
function repeat(string, n) {
  return (new Array(n + 1)).join(string);
}

describe('Scalar style dump:', function () {

  describe('Plain style', function () {
    it('is preferred', function () {
      [ 'plain',
        'hello world',
        'pizza 3.14159',
        // cannot be misinterpreted as a number
        '127.0.0.1',
        // quotes are allowed after the first character
        'quoted"scalar',
        'here\'s to "quotes"',
        // additional allowed characters
        '100% safe non-first characters? Of course!',
        'Jack & Jill <well@example.com>'
      ].forEach(function (string) {
        assert.strictEqual(yaml.dump(string), string + '\n');
      });
    });

    it('disallows flow indicators inside flow collections', function () {
      assert.strictEqual(yaml.dump({ quote: 'mispell [sic]' }, { flowLevel: 0 }),
        "{quote: 'mispell [sic]'}\n");
      assert.strictEqual(yaml.dump({ key: 'no commas, either' }, { flowLevel: 0 }),
        "{key: 'no commas, either'}\n");
    });
  });

  describe('Single- and double-quoted styles', function () {
    it('quote strings of ambiguous type', function () {
      assert.strictEqual(yaml.dump('Yes'), '\'Yes\'\n');
      assert.strictEqual(yaml.dump('true'), '\'true\'\n');
      assert.strictEqual(yaml.dump('42'), '\'42\'\n');
      assert.strictEqual(yaml.dump('99.9'), '\'99.9\'\n');
      assert.strictEqual(yaml.dump('127.0001'), '\'127.0001\'\n');
      assert.strictEqual(yaml.dump('1.23015e+3'), '\'1.23015e+3\'\n');
    });

    it('quote leading/trailing whitespace', function () {
      assert.strictEqual(yaml.dump(' leading space'), '\' leading space\'\n');
      assert.strictEqual(yaml.dump('trailing space '), '\'trailing space \'\n');
    });

    it('quote leading quotes', function () {
      assert.strictEqual(yaml.dump("'singles double'"), "'''singles double'''\n");
      assert.strictEqual(yaml.dump('"single double'), '\'"single double\'\n');
    });

    it('escape \\ and " in double-quoted', function () {
      assert.strictEqual(yaml.dump('\u0007 escape\\ escaper"'), '"\\a escape\\\\ escaper\\""\n');
    });

    it('escape non-printables', function () {
      assert.strictEqual(yaml.dump('a\nb\u0001c'), '"a\\nb\\x01c"\n');
    });
  });

  describe('Literal style', function () {
    var content = 'a\nb \n\n c\n  d', indented = indent(content);

    it('preserves trailing newlines using chomping', function () {
      assert.strictEqual(yaml.dump({ a: '\n', b: '\n\n', c: 'c\n', d: 'd\nd' }),
        'a: |+\n\nb: |+\n\n\nc: |\n  c\nd: |-\n  d\n  d\n');
      assert.strictEqual(yaml.dump('\n'),               '|+\n' + '\n');
      assert.strictEqual(yaml.dump('\n\n'),             '|+\n' + '\n\n');

      assert.strictEqual(yaml.dump(content),            '|-\n' + indented + '\n');
      assert.strictEqual(yaml.dump(content + '\n'),     '|\n'  + indented + '\n');
      assert.strictEqual(yaml.dump(content + '\n\n'),   '|+\n' + indented + '\n\n');
      assert.strictEqual(yaml.dump(content + '\n\n\n'), '|+\n' + indented + '\n\n\n');
    });

    it('accepts leading whitespace', function () {
      assert.strictEqual(yaml.dump('   ' + content), '|2-\n   ' + indented + '\n');
    });

    it('falls back to quoting when required indent indicator is too large', function () {
      assert.strictEqual(yaml.dump(' these go\nup to\neleven', { indent: 11 }),
        '" these go\\nup to\\neleven"\n');
    });

    it('does not use block style for multiline key', function () {
      assert.strictEqual(yaml.dump({
        'push\nand': {
          you: 'pull'
        }
      }), '"push\\nand":\n  you: pull\n');
    });
  });

  describe('Folded style', function () {
    (function () {
      var content = (function () {
        var result = '';
        var i = 1000;
        for (var para = 1; para <= 7; para++) {
          result += '\n';
          // indent paragraphs 3 and 4
          if (para === 3 || para === 4) {
            result += repeat(' ', para);
          }
          // vary the number of words on the last line
          for (var count = 2 * (30 / 5) + para - 1; count > 0; count--) {
            result += i + ' ';
            if (i % 17 === 0) result += ' ';
            i++;
          }
        }
        return result;
      }());
      var wrapped = '\n' +
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
        '1099 1100 1101 1102 1103 1104 ';
      var indented = indent(wrapped);

      function dumpNarrow(s) {
        return yaml.dump(s, { lineWidth: 30 + 2 });
      }

      it('wraps lines and ignores more-indented lines ', function () {
        assert.strictEqual(dumpNarrow(content),            '>-\n' + indented + '\n');
      });

      it('preserves trailing newlines using chomping', function () {
        assert.strictEqual(dumpNarrow(content + '\n'),     '>\n'  + indented + '\n');
        assert.strictEqual(dumpNarrow(content + '\n\n'),   '>+\n' + indented + '\n\n');
        assert.strictEqual(dumpNarrow(content + '\n\n\n'), '>+\n' + indented + '\n\n\n');
      });
    }());

    // Dump and check that dump-then-load preserves content (is the identity function).
    function dump(input, opts) {
      var output = yaml.dump(input, opts);
      assert.strictEqual(yaml.load(output), input, 'Dump then load should preserve content');
      return output;
    }

    it('should not cut off a long word at the start of a line', function () {
      assert.strictEqual(dump('123\n' + repeat('1234567890', 9) + ' hello\ngoodbye'),
        '>-\n' + indent(
          '123\n' +
          '\n' +
          repeat('1234567890', 9) + '\n' +
          'hello\n' +
          '\n' +
          'goodbye\n'));
    });

    it('preserves consecutive spaces', function () {
      var alphabet = 'a bc  def  ghi' + repeat(' ', 70) + 'jk  lmn o\n'
        + ' p  qrstu     v' + repeat(' ', 80) + '\nw x\n' + 'yz  ';
      assert.strictEqual(dump(alphabet),
        '>-\n' + indent(
          'a bc  def \n' +
          'ghi' + repeat(' ', 70) + 'jk \n' +
          'lmn o\n' +
          ' p  qrstu     v' + repeat(' ', 80) + '\n' +
          'w x\n' +
          '\n' +
          'yz  \n'));

      var indeed = repeat('word. ', 31) + '\n' +
        [ 2, 3, 5, 7, 11, 13, 17 ]
          .map(function (n) { return repeat(' ', n); })
          .join('\n');
      assert.strictEqual(dump(indeed),
        '>-\n' + indent(
          'word. word. word. word. word. word. word. word. word. word. word. word. word.\n' +
          'word. word. word. word. word. word. word. word. word. word. word. word. word.\n' +
          'word. word. word. word. word. \n' +
          [ 2, 3, 5, 7, 11, 13, 17 ]
            .map(function (n) { return repeat(' ', n); })
            .join('\n') + '\n'));
    });

    var story = 'Call me Ishmael. Some years ago—never mind how long precisely—'
    + 'having little or no money in my purse, '
    + 'and nothing particular to interest me on shore, '
    + 'I thought I would sail about a little and see the watery part of the world...';
    var prefix = 'var short_story = "",';
    var line = 'longer_story = "' + story + '";';

    it('should fold a long last line missing an ending newline', function () {
      var content = [ prefix, line ].join('\n');

      var lengths = dump(content).split('\n').map(getLength);
      assert.deepStrictEqual(lengths, [ 2, 23, 0, 69, 76, 80, 24, 0 ]);
    });

    it('should not fold a more-indented last line', function functionName() {
      var content = [ prefix, line, '    ' + line ].join('\n');

      var lengths = dump(content).split('\n').map(getLength);
      assert.deepStrictEqual(lengths, [ 2, 23, 0, 69, 76, 80, 24, 250, 0 ]);
    });

    it('should not fold when lineWidth === -1', function () {
      var content = [ prefix, line, line + line, line ].join('\n');

      assert.strictEqual(dump(content, { lineWidth: -1 }), '|-\n' + indent(content) + '\n');
    });

    it('falls back to literal style when no lines are foldable', function () {
      var content = [ prefix, '    ' + line, '    ' + line ].join('\n');

      assert.strictEqual(dump(content), '|-\n' + indent(content) + '\n');
    });
  });
});
