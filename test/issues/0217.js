'use strict';


var assert = require('assert');
var yaml   = require('../../');


// Simplistic check for folded style header at the end of the first line.
function isFolded(s) {
  return s.search(/^[^\n]*>[\-+]?\n/) !== -1;
}

// Runs one cycle of dump then load. Also checks that dumped result is folded.
function loadAfterDump(input) {
  var output = yaml.dump(input);
  if (!isFolded(output)) {
    assert.fail(output, '(first line should end with >-, >, or >+)',
      'Test cannot continue: folded style was expected');
  }
  return yaml.load(output);
}


test('Folding Javascript functions preserves content', function () {
  // Tests loading a function, then tests dumping and loading.
  function assertFunctionPreserved(functionString, inputs, expectedOutputs, name) {
    var f = yaml.load('!<tag:yaml.org,2002:js/function> "' + functionString + '"');
    assert.strictEqual(typeof f, 'function', name + ' should be loaded as a function');

    assert.deepEqual(inputs.map(f), expectedOutputs,
      name + ' should be loaded correctly');

    assert.deepEqual(inputs.map(loadAfterDump(f)), expectedOutputs,
      name + ' should be dumped then loaded correctly');
  }

  // Backslash-escapes double quotes and newlines.
  function escapeFnString(s) {
    return s.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  var fnFactorial = escapeFnString(
    'function factorial(start) {\n' +
    '// Non-indented long line to trigger folding: throw new Error("bad fold"); throw new Error("bad fold");\n' +
    '  var extra_long_string = "try to trick the dumper into creating a syntax error by folding this string";\n' +
    '  var extra_long_string1 = "try to trick the dumper into creating a syntax error by folding this string";\n' +
    'var extra_long_string2 = "this long string is fine to fold because it is not more-indented";\n' +
    'function fac (n) {\n' +
      'if (n <= 0) return 1; return n * fac(n-1); // here is a long line that can be safely folded\n' +
    '}\n' +
    'return fac(start);\n' +
    '}\n');

  var fnCollatz = escapeFnString(
    'function collatz(start) {\n' +
    '  var longString = "another long more-indented string that will cause a syntax error if folded";\n' +
    'var result = [];\n' +
    'function go(n) { result.push(n); return (n === 1) ? result : go(n % 2 === 0  ?  n / 2  :  3 * n + 1); }\n' +
    'return go(start >= 1 ? Math.floor(start) : 1);\n' +
    '}');

  var fnRot13 = escapeFnString(
    // single-line function.
    // note the "{return" is so the line doesn't start with a space.
    'function rot13(s) {return String.fromCharCode.apply(null, s.split("")' +
    '.map(function (c) { return ((c.toLowerCase().charCodeAt(0) - 97) + 13) % 26 + 97; })); }'
  );

  assertFunctionPreserved(fnFactorial,
    [ 0, 1, 2, 3,   5,    7,        12 ],
    [ 1, 1, 2, 6, 120, 5040, 479001600 ],
    'Factorial function');

  assertFunctionPreserved(fnCollatz,
    [ 6, 19 ],
    [ [ 6, 3, 10, 5, 16, 8, 4, 2, 1 ],
      [ 19, 58, 29, 88, 44, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1 ]
    ], 'Hailstone sequence function');

  assertFunctionPreserved(fnRot13,
    [ 'nggnpxngqnja', 'orjnergurvqrfbsznepu' ],
    [ 'attackatdawn', 'bewaretheidesofmarch' ]
  , 'ROT13');
});

test('Folding long regular expressions preserves content', function () {
  // Tests loading a regex, then tests dumping and loading.
  function assertRegexPreserved(string, stringPattern) {
    assert.strictEqual(string.search(stringPattern), 0,
      'The test itself has errors: regex did not match its string');

    var loadedRe = yaml.load('"key": !<tag:yaml.org,2002:js/regexp> /'
      + stringPattern + '/').key;
    assert.strictEqual(loadedRe.exec(string)[0], string,
      'Loaded regex did not match the original string');

    assert.strictEqual(
      loadAfterDump({ key: new RegExp(stringPattern) }).key.exec(string)[0],
      string,
      'Dumping and loading did not preserve the regex');
  }

  var s1        =  'This is a very long regular expression. ' +
    'It\'s so long that it is longer than 80 characters per line.';
  var s1Pattern = '^This is a very long regular expression\\. ' +
    'It\'s so long that it is longer than 80 characters per line\\.$';

  assertRegexPreserved(s1, s1Pattern);
});

test('Strings are folded as usual', function () {
  var doc = yaml.load('"key": |\n  It is just a very long string. It should be folded because the dumper ' +
    'fold lines that are exceed limit in 80 characters per line.');
  var dump = yaml.dump(doc);
  assert(Math.max.apply(null, dump.split('\n').map(function (str) { return str.length; })) <= 80);
});
