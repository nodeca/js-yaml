'use strict';

var essay = 'a\n' +
  'b\n' +
  '1sdf 2ar 3sdf 4sdf 5sdf 6sdf 7sdf 8sdf 9sdf 10asdf 11asdf ' +
    '12asdf 13asdf 14asdf 15df 16df long  17df 1890 1900 2000 ' +
    '2001 2002 baz\n' +
  '2003 2004 4sdf 4sdf 7sdf 8sdf 9sdf 0sdf 1sdf 2sdf 3sdf ' +
    '4sdf 5sdf 6sdf long  7sdf 8sdf 9sdf 0sdf 2002 asdfasdf ' +
    '2003 2006 2020 2021 2022 2023 2024 2025 long  2026 2027 ' +
    '2028 2029 2030 2031 2032 2033 2034 2035 asdfasdf 02036 ' +
    '2040 2041 long  2042 2043 2044 2045 2046 2027 2048 ' +
    '2050 4444 5555 6666 7777 8888 9999 long  asdfasdf ' +
    'aaaa bbbb cccc dddd eeeee fff ggggggg hhhi iiii jjjj ' +
    'long  asdfasdfasdfasdfslong                         ' +
    '                                              xlong  ' +
    'asdfasdfasdfasdfasdfasdfasdfasd asdf xasdf the  end';

module.exports = {
  simpleString: 'hello world',
  simpleStringComma: 'hello, world',
  stackTrace: 'Error: foo\n' +
    '    at repl:1:5\n' +
    '    at REPLServer.defaultEval (repl.js:116:27)\n' +
    '    at bound (domain.js:254:14)',

  trailingSpace: 'hello space    ',
  trailingTab: 'hello tab  \t',
  trailingCR: 'hello newline\n',

  simpleQuotes: 'won\'t you be my neighbor',
  unprintable: 'number 1 is \u0001 and the biggest byte is \uffff ok',

  multiline: 'hello\nworld\n',
  multilineChomp: 'hello\nworld',
  multilineTrailingCR: 'hello\nworld\n\n\n\n\n',
  multilineTrailingSpace: 'hello\nworld    \nspace\n',
  multilineTrailingSpaceChomp: 'hello\nworld    \nspace',

  longMultiBigSpace: 'x' + new Array(100).join(' ') + 'y\nworld\n',
  longMultiBigSpaceChomp: 'x' + new Array(100).join(' ') + 'y\nworld',

  essayNoTrailing: essay,
  essayManyTrailing: essay + '\n\n\n\n\n\n',
  essayOneTrailing: essay + '\n',

  neggy: '-1',
  questy: '?asdf',

  // Example 8.1.
  blockScalarHeader: [ 'literal\n', ' folded\n', 'keep\n\n', ' strip' ],
  // Example 8.2.
  // The ' \t' is a more-indented line as per [177] s-nb-spaced-text.
  blockIndentationIndicator: [
    'detected\n', '\n\n# detected\n', ' explicit\n', '\t\ndetected\n'
  ],
  // Example 8.6. Empty Scalar Chomping
  strip: '',
  clip: '',
  keep: '\n',
  // Example 8.10.
  foldedStyle: '\nfolded line\nnext line\n' +
    '  * bullet\n\n  * list\n  * lines\n\nlast line\n',

  longMultiChomp: new Array(80).join('lo hel') + '\nworld',
  longMultiTrailingCR: new Array(80).join('lo hel') + '\nworld\n\n\n\n\n',
  longMulti: new Array(80).join('lo hel') + '\nworld\n'

};

// now indent the long multi really far
var obj = module.exports,
    i;

for (i = 0; i < 5; i++) {
  obj.indent = {};
  obj = obj.indent;
}

obj.ind = module.exports.longMulti;

for (i = 0; i < 5; i++) {
  obj.indent = {};
  obj = obj.indent;
}

obj.ind = module.exports.longMulti;

for (i = 0; i < 5; i++) {
  obj.indent = {};
  obj = obj.indent;
}

obj.ind = module.exports.longMulti;

for (i = 0; i < 5; i++) {
  obj.indent = {};
  obj = obj.indent;
}

obj.ind = module.exports.longMulti;

for (i = 0; i < 5; i++) {
  obj.indent = {};
  obj = obj.indent;
}

obj.ind = module.exports.longMulti;

for (i = 0; i < 5; i++) {
  obj.indent = {};
  obj = obj.indent;
}
obj.ind = module.exports.longMulti;
