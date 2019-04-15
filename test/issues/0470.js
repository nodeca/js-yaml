'use strict';

var assert = require('assert');
var yaml = require('../..');

test('should not unnecessarily apply quotes', function () {

  var expected = 'url: https://github.com/nodeca/js-yaml\n';
  var input = {
    url: 'https://github.com/nodeca/js-yaml'
  };

  var actual = yaml.dump(input);
  assert.strictEqual(actual, expected);

  var roundTrip = yaml.safeLoad(actual);
  assert.deepStrictEqual(roundTrip, input);
});

test('should not unnecessarily apply quotes - space then /\n at end of value', function () {

  var expected = 'url: \'https://github.com/nodeca/js-yaml \'\n';
  var input = {
    url: 'https://github.com/nodeca/js-yaml '
  };

  var actual = yaml.dump(input);
  assert.strictEqual(actual, expected);

  var roundTrip = yaml.safeLoad(actual);
  assert.deepStrictEqual(roundTrip, input);
});

test('should not unnecessarily apply quotes - space after colon', function () {

  var expected = 'url: \'https: //github.com/nodeca/js-yaml\'\n';
  var input = {
    url: 'https: //github.com/nodeca/js-yaml'
  };

  var actual = yaml.dump(input);
  assert.strictEqual(actual, expected);

  var roundTrip = yaml.safeLoad(actual);
  assert.deepStrictEqual(roundTrip, input);
});

/*
  check for the removal of these dumper checks to deliver proper output

    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // - ":" - "#"
    && c !== CHAR_COLON
    && c !== CHAR_SHARP;
 */
test('should not unnecessarily apply quotes - : colon, # sharp, comma and []{}', function () {

  var expected = [
    'sharp1: C#123',
    'sharp2: C# 123',
    "sharp3: 'C #123'",
    'sharp4: C123#',
    "sharp5: '#C123'",
    "sharp6: '#C123#'",
    'colon1: C:123',
    "colon2: 'C: 123'",
    'colon3: C :123',
    "colon4: 'C123:'",
    "colon5: ':C123'",
    "colon6: ':C123:'",
    'comma1: C,123',
    'comma2: C, 123',
    'comma3: C ,123',
    'comma4: C123,',
    "comma5: ',C123'",
    "comma6: ',C123,'",
    'sqbr1: C[1]23',
    'sqbr2: C [1]23',
    "sqbr3: '[C] 123'",
    'sqbr4: C12[3]',
    "sqbr5: '[C]123'",
    "sqbr6: '[C]12[3]'",
    "sqbr7: '[]C123[]'",
    'sqbr8: C [123]',
    'cbr1: C{1}23',
    'cbr2: C {1}23',
    "cbr3: '{C} 123'",
    'cbr4: C12{3}',
    "cbr5: '{C}123'",
    "cbr6: '{C}12{3}'",
    "cbr7: '{}C123{}'",
    'cbr8: C {123}',
    ''
  ].join('\n');
  var input = {
    sharp1: 'C#123',
    sharp2: 'C# 123',
    sharp3: 'C #123',
    sharp4: 'C123#',
    sharp5: '#C123',
    sharp6: '#C123#',

    colon1: 'C:123',
    colon2: 'C: 123',
    colon3: 'C :123',
    colon4: 'C123:',
    colon5: ':C123',
    colon6: ':C123:',

    comma1: 'C,123',
    comma2: 'C, 123',
    comma3: 'C ,123',
    comma4: 'C123,',
    comma5: ',C123',
    comma6: ',C123,',

    sqbr1: 'C[1]23',
    sqbr2: 'C [1]23',
    sqbr3: '[C] 123',
    sqbr4: 'C12[3]',
    sqbr5: '[C]123',
    sqbr6: '[C]12[3]',
    sqbr7: '[]C123[]',
    sqbr8: 'C [123]',

    cbr1: 'C{1}23',
    cbr2: 'C {1}23',
    cbr3: '{C} 123',
    cbr4: 'C12{3}',
    cbr5: '{C}123',
    cbr6: '{C}12{3}',
    cbr7: '{}C123{}',
    cbr8: 'C {123}'
  };

  var actual = yaml.dump(input);
  assert.strictEqual(actual, expected);

  var roundTrip = yaml.safeLoad(actual);
  assert.deepStrictEqual(roundTrip, input);
});
