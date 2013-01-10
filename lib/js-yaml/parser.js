'use strict';


var CHAR_TAB                 = 0x09;   /* Tab */
var CHAR_LINE_FEED           = 0x0A;   /* LF */
var CHAR_CARRIAGE_RETURN     = 0x0D;   /* CR */
var CHAR_SPACE               = 0x20;   /* Space */
var CHAR_EXCLAMATION         = 0x21;   /* ! */
var CHAR_DOUBLE_QUOTE        = 0x22;   /* " */
var CHAR_SHARP               = 0x23;   /* # */
var CHAR_PERCENT             = 0x25;   /* % */
var CHAR_AMPERSAND           = 0x26;   /* & */
var CHAR_SINGLE_QUOTE        = 0x27;   /* ' */
var CHAR_ASTERISK            = 0x2A;   /* * */
var CHAR_HYPHEN              = 0x2D;   /* - */
var CHAR_DOT                 = 0x2E;   /* . */
var CHAR_SLASH               = 0x2F;   /* / */
var CHAR_DIGIT_ZERO          = 0x30;   /* 0 */
var CHAR_DIGIT_ONE           = 0x31;   /* 1 */
var CHAR_DIGIT_TWO           = 0x32;   /* 2 */
var CHAR_DIGIT_THREE         = 0x33;   /* 3 */
var CHAR_DIGIT_TOUR          = 0x34;   /* 4 */
var CHAR_DIGIT_FIVE          = 0x35;   /* 5 */
var CHAR_DIGIT_SIX           = 0x36;   /* 6 */
var CHAR_DIGIT_SEVEN         = 0x37;   /* 7 */
var CHAR_DIGIT_EIGHT         = 0x38;   /* 8 */
var CHAR_DIGIT_NINE          = 0x39;   /* 9 */
var CHAR_COLON               = 0x3A;   /* : */
var CHAR_GREATER_THAN        = 0x3E;   /* > */
var CHAR_QUESTION            = 0x3F;   /* ? */
var CHAR_CAPITAL_A           = 0x41;   /* A */
var CHAR_CAPITAL_F           = 0x46;   /* F */
var CHAR_CAPITAL_L           = 0x4C;   /* L */
var CHAR_CAPITAL_N           = 0x4E;   /* N */
var CHAR_CAPITAL_P           = 0x50;   /* P */
var CHAR_CAPITAL_U           = 0x55;   /* U */
var CHAR_BACKSLASH           = 0x5C;   /* \ */
var CHAR_UNDERSCORE          = 0x5F;   /* _ */
var CHAR_SMALL_A             = 0x61;   /* a */
var CHAR_SMALL_B             = 0x62;   /* b */
var CHAR_SMALL_E             = 0x65;   /* e */
var CHAR_SMALL_F             = 0x66;   /* f */
var CHAR_SMALL_N             = 0x6E;   /* n */
var CHAR_SMALL_R             = 0x72;   /* r */
var CHAR_SMALL_T             = 0x74;   /* t */
var CHAR_SMALL_U             = 0x75;   /* u */
var CHAR_SMALL_V             = 0x76;   /* v */
var CHAR_SMALL_X             = 0x78;   /* x */
var CHAR_VERTICAL_LINE       = 0x7C;   /* | */
var CHAR_NEXT_LINE           = 0x85;   /* NEL */
var CHAR_LINE_SEPARATOR      = 0x2028; /* LS */
var CHAR_PARAGRAPH_SEPARATOR = 0x2029; /* PS */


var SIMPLE_ESCAPE_SEQUENCES = {};

SIMPLE_ESCAPE_SEQUENCES[CHAR_DIGIT_ZERO]   = '\x00';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_A]      = '\x07';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_B]      = '\x08';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_T]      = '\x09';
SIMPLE_ESCAPE_SEQUENCES[CHAR_TAB]          = '\x09';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_N]      = '\x0A';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_V]      = '\x0B';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_F]      = '\x0C';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_R]      = '\x0D';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_E]      = '\x1B';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SPACE]        = ' ',
SIMPLE_ESCAPE_SEQUENCES[CHAR_DOUBLE_QUOTE] = '\x22';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SLASH]        = '\\';
SIMPLE_ESCAPE_SEQUENCES[CHAR_BACKSLASH]    = '\x5C';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_N]    = '\x85';
SIMPLE_ESCAPE_SEQUENCES[CHAR_UNDERSCORE]   = '\xA0';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_L]    = '\u2028';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_P]    = '\u2029';


var HEXADECIMAL_ESCAPE_SEQUENCES = {};

HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_SMALL_X]   = 2;
HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_SMALL_U]   = 4;
HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_CAPITAL_U] = 8;



module.exports = function parse(input, settings) {
  var length      = input.length,
      position    = 0,
      character   = input.charCodeAt(position),
      indent      = -1,
      indentStack = [],
      object      = null,
      objectStack = [],
      safeMode    = true;

  if (undefined !== settings && null !== settings) {
    if (undefined !== settings.safe && null !== settings.safe) {
      safeMode = settings.safe;
    }
  }

  ////////////////////////////////////////////////////////////////////////////

  function throwParseError(message) {
    throw new Error(
      'YAML parse error: ' +
      (message || '(unknown reason)') +
      ' at position ' + position);
  }

  function capture(start, end, checkJson) {
    var result, index, length, captured;

    if (start < end) {
      result = input.slice(start, end);
      
      if (checkJson && safeMode) {
        for (index = 0, length = result.length; index < length; index += 1) {
          captured = result.charCodeAt(index);
          if (!(0x09 === captured ||
                0x20 <= captured && captured <= 0x10FFFF)) {
            throwParseError('unexpected character');
          }
        }
      }

      object += result;
    }
  }

  function readLineBreak() {
    if (CHAR_LINE_FEED === character) {
      position += 1;
    } else if (CHAR_CARRIAGE_RETURN === character) {
      if (CHAR_LINE_FEED === input.charCodeAt(position + 1)) {
        position += 2;
      } else {
        position += 1;
      }
    }

    character = input.charCodeAt(position);
  }

  ////////////////////////////////////////////////////////////////////////////
  
  // NOTE: This function must be called on a line break. Scalar readers must
  // treat line's trailing whitespaces by themselves.
  function foldLines() {
    var lineIndent, emptyLines = -1;

    // Read empty lines.
    while (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
      readLineBreak();
      emptyLines += 1;
      lineIndent = 0;

      // Read the line's indent.
      while (lineIndent < indent && CHAR_SPACE === character) {
        lineIndent += 1;
        position += 1;
        character = input.charCodeAt(position);
      }

      // If the current line is less indented, it should not have any content.
      // TODO: It is not suitable for plain and block scalars.
      if (lineIndent < indent &&
          CHAR_LINE_FEED !== character &&
          CHAR_CARRIAGE_RETURN !== character) {
        throwParseError('unexpected content');
      }

      // Skip the line's prefix and/or empty line content.
      while (CHAR_SPACE === character || CHAR_TAB === character) {
        position += 1;
        character = input.charCodeAt(position);
      }
    }

    if (emptyLines === 0) {
      object += ' ';
    } else if (emptyLines > 0) {
      while (emptyLines-- > 0) {
        object += '\n';
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  
  function readDoubleQuotedScalar() {
    var captureStart, captureEnd, hexLength, hexIndex, hexOffset, hexResult;

    object = '';

    if (CHAR_DOUBLE_QUOTE === character) {
      position += 1;
      captureStart = position;
      character = input.charCodeAt(position);
    } else {
      throwParseError('expected double quoted scalar');
    }

    while (position < length) {
      if (CHAR_DOUBLE_QUOTE === character) {
        capture(captureStart, position, true);
        position += 1;
        character = input.charCodeAt(position);
        return;

      } else if (CHAR_BACKSLASH === character) {
        capture(captureStart, position, true);
        position += 1;
        character = input.charCodeAt(position);

        if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
          foldLines();

        } else if (SIMPLE_ESCAPE_SEQUENCES[character]) {
          object += SIMPLE_ESCAPE_SEQUENCES[character];
          position += 1;
          character = input.charCodeAt(position);

        } else if (HEXADECIMAL_ESCAPE_SEQUENCES[character]) {
          hexLength = HEXADECIMAL_ESCAPE_SEQUENCES[character];
          hexResult = 0;

          for (hexIndex = 1; hexIndex <= hexLength; hexIndex += 1) {
            hexOffset = (hexLength - hexIndex) * 4;
            position += 1;
            character = input.charCodeAt(position);

            if (CHAR_DIGIT_ZERO <= character && character <= CHAR_DIGIT_NINE) {
              hexResult |= (character - CHAR_DIGIT_ZERO) << hexOffset;

            } else if (CHAR_CAPITAL_A <= character && character <= CHAR_CAPITAL_F) {
              hexResult |= (character - CHAR_CAPITAL_A + 10) << hexOffset;

            } else if (CHAR_SMALL_A <= character && character <= CHAR_SMALL_F) {
              hexResult |= (character - CHAR_SMALL_A + 10) << hexOffset;

            } else {
              throwParseError('expected hexadecimal character');
            }
          }

          object += String.fromCharCode(hexResult);
          position += 1;
          character = input.charCodeAt(position);

        } else {
          throwParseError('unknown escape sequence');
        }
        
        captureStart = position;

      } else if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        captureEnd = position;

        do {
          captureEnd -= 1;
          character = input.charCodeAt(captureEnd);
        } while (captureEnd >= captureStart &&
                 (CHAR_SPACE === character ||
                  CHAR_TAB === character));

        capture(captureStart, captureEnd + 1, true);
        character = input.charCodeAt(position);
        foldLines();
        captureStart = position;
        captureEnd = -1;

      } else {
        position += 1;
        character = input.charCodeAt(position);
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////

  if (safeMode) {
    if (/[^\x09\x0A\x0D -~\x85\xA0-\uD7FF\uE000-\uFFFD]/.test(input)) {
      throwParseError('the stream contains non-printable characters');
    }
  }

  readDoubleQuotedScalar();
  return object;
};
