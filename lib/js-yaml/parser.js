'use strict';


var _hasOwn = Object.prototype.hasOwnProperty;


var KIND_SCALAR   = 1;
var KIND_SEQUENCE = 2;
var KIND_MAPPING  = 3;


var CHAR_TAB                  = 0x09;   /* Tab */
var CHAR_LINE_FEED            = 0x0A;   /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D;   /* CR */
var CHAR_SPACE                = 0x20;   /* Space */
var CHAR_EXCLAMATION          = 0x21;   /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22;   /* " */
var CHAR_SHARP                = 0x23;   /* # */
var CHAR_PERCENT              = 0x25;   /* % */
var CHAR_AMPERSAND            = 0x26;   /* & */
var CHAR_SINGLE_QUOTE         = 0x27;   /* ' */
var CHAR_ASTERISK             = 0x2A;   /* * */
var CHAR_COMMA                = 0x2C;   /* , */
var CHAR_HYPHEN               = 0x2D;   /* - */
var CHAR_DOT                  = 0x2E;   /* . */
var CHAR_SLASH                = 0x2F;   /* / */
var CHAR_DIGIT_ZERO           = 0x30;   /* 0 */
var CHAR_DIGIT_ONE            = 0x31;   /* 1 */
var CHAR_DIGIT_TWO            = 0x32;   /* 2 */
var CHAR_DIGIT_THREE          = 0x33;   /* 3 */
var CHAR_DIGIT_TOUR           = 0x34;   /* 4 */
var CHAR_DIGIT_FIVE           = 0x35;   /* 5 */
var CHAR_DIGIT_SIX            = 0x36;   /* 6 */
var CHAR_DIGIT_SEVEN          = 0x37;   /* 7 */
var CHAR_DIGIT_EIGHT          = 0x38;   /* 8 */
var CHAR_DIGIT_NINE           = 0x39;   /* 9 */
var CHAR_COLON                = 0x3A;   /* : */
var CHAR_GREATER_THAN         = 0x3E;   /* > */
var CHAR_QUESTION             = 0x3F;   /* ? */
var CHAR_CAPITAL_A            = 0x41;   /* A */
var CHAR_CAPITAL_F            = 0x46;   /* F */
var CHAR_CAPITAL_L            = 0x4C;   /* L */
var CHAR_CAPITAL_N            = 0x4E;   /* N */
var CHAR_CAPITAL_P            = 0x50;   /* P */
var CHAR_CAPITAL_U            = 0x55;   /* U */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B;   /* [ */
var CHAR_BACKSLASH            = 0x5C;   /* \ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D;   /* ] */
var CHAR_UNDERSCORE           = 0x5F;   /* _ */
var CHAR_SMALL_A              = 0x61;   /* a */
var CHAR_SMALL_B              = 0x62;   /* b */
var CHAR_SMALL_E              = 0x65;   /* e */
var CHAR_SMALL_F              = 0x66;   /* f */
var CHAR_SMALL_N              = 0x6E;   /* n */
var CHAR_SMALL_R              = 0x72;   /* r */
var CHAR_SMALL_T              = 0x74;   /* t */
var CHAR_SMALL_U              = 0x75;   /* u */
var CHAR_SMALL_V              = 0x76;   /* v */
var CHAR_SMALL_X              = 0x78;   /* x */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B;   /* { */
var CHAR_VERTICAL_LINE        = 0x7C;   /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D;   /* } */
var CHAR_NEXT_LINE            = 0x85;   /* NEL */
var CHAR_LINE_SEPARATOR       = 0x2028; /* LS */
var CHAR_PARAGRAPH_SEPARATOR  = 0x2029; /* PS */


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
  var length    = input.length,
      position  = 0,
      line      = 0,
      character = input.charCodeAt(position),
      safeMode  = true,
      result;

  if (undefined !== settings && null !== settings) {
    if (undefined !== settings.safe && null !== settings.safe) {
      safeMode = settings.safe;
    }
  }

  function throwParseError(message) {
    throw new Error(
      'YAML parse error: ' +
      (message || '(unknown reason)') +
      ' at position ' + position);
  }

  function captureSegment(start, end, checkJson) {
    var _position, _length, _character, _result;

    if (start < end) {
      _result = input.slice(start, end);

      if (checkJson && safeMode) {
        for (_position = 0, _length = _result.length;
             _position < _length;
             _position += 1) {
          _character = _result.charCodeAt(_position);
          if (!(0x09 === _character ||
                0x20 <= _character && _character <= 0x10FFFF)) {
            throwParseError('expected valid JSON character');
          }
        }
      }

      result += _result;
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
    } else {
      throwParseError('a line break is expected');
    }

    line += 1;
    character = input.charCodeAt(position);
  }

  function skipFlowSeparationSpace(indent) {
    var _position = position, _indent;

    while (position < length) {
      while (CHAR_SPACE === character || CHAR_TAB === character) {
        character = input.charCodeAt(++position);
      }

      if (CHAR_SHARP === character) {
        do { character = input.charCodeAt(++position); }
        while (position < length &&
               CHAR_LINE_FEED !== character &&
               CHAR_CARRIAGE_RETURN !== character);
      }

      if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        readLineBreak();
        _indent = 0;

        while (CHAR_SPACE === character) {
          _indent += 1;
          character = input.charCodeAt(++position);
        }

        if (_indent < indent) {
          throwParseError('deficient indentation within a flow node');
        }
      } else {
        break;
      }
    }

    return position !== _position;
  }

  // NOTE: This function must be called on a line break. Flow scalar readers
  // must treat line's trailing whitespaces by themselves.
  function performFlowFolding(expectedIndent) {
    var actualIndent, emptyLines = -1;

    while (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
      emptyLines += 1;
      readLineBreak();
      actualIndent = 0;

      // Read indent of a line.
      while (actualIndent < expectedIndent && CHAR_SPACE === character) {
        actualIndent += 1;
        character = input.charCodeAt(++position);
      }

      // If the current line is less indented, it should not have any content.
      // TODO: It is not suitable for plain scalars.
      if (actualIndent < expectedIndent &&
          CHAR_LINE_FEED !== character &&
          CHAR_CARRIAGE_RETURN !== character) {
        throwParseError('unexpected content');
      }

      // Skip the line's prefix and/or empty line content.
      while (CHAR_SPACE === character || CHAR_TAB === character) {
        character = input.charCodeAt(++position);
      }
    }

    if (emptyLines === 0) {
      result += ' ';
    } else if (emptyLines > 0) {
      do {
        result += '\n';
        emptyLines -= 1;
      } while (emptyLines > 0);
    }
  }

  function findContentEnd(borderPosition) {
    var _position  = position,
        _character = input.charCodeAt(_position - 1);

    while (_position >= borderPosition &&
           (CHAR_SPACE === _character || CHAR_TAB === _character)) {
      _position -= 1;
      _character = input.charCodeAt(_position - 1);
    }

    return _position;
  }

  function readSingleQuotedScalar(indent) {
    var captureStart;

    if (CHAR_SINGLE_QUOTE !== character) {
      return false;
    }

    result = '';
    character = input.charCodeAt(++position);
    captureStart = position;

    while (position < length) {
      if (CHAR_SINGLE_QUOTE === character) {
        captureSegment(captureStart, position, true);
        character = input.charCodeAt(++position);

        if (CHAR_SINGLE_QUOTE === character) {
          captureStart = position;
          character = input.charCodeAt(++position);
        } else {
          return true;
        }

      } else if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        captureSegment(captureStart, findContentEnd(captureStart), true);
        performFlowFolding(indent);
        captureStart = position;
        character = input.charCodeAt(position);

      } else {
        character = input.charCodeAt(++position);
      }
    }

    throwParseError('unexpected end of the stream within a single quoted scalar');
  }
  
  function readDoubleQuotedScalar(indent) {
    var captureStart, hexLength, hexIndex, hexOffset, hexResult;

    if (CHAR_DOUBLE_QUOTE !== character) {
      return false;
    }

    result = '';
    character = input.charCodeAt(++position);
    captureStart = position;

    while (position < length) {
      if (CHAR_DOUBLE_QUOTE === character) {
        captureSegment(captureStart, position, true);
        character = input.charCodeAt(++position);
        return true;

      } else if (CHAR_BACKSLASH === character) {
        captureSegment(captureStart, position, true);
        character = input.charCodeAt(++position);

        if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
          performFlowFolding();

        } else if (SIMPLE_ESCAPE_SEQUENCES[character]) {
          result += SIMPLE_ESCAPE_SEQUENCES[character];
          character = input.charCodeAt(++position);

        } else if (HEXADECIMAL_ESCAPE_SEQUENCES[character]) {
          hexLength = HEXADECIMAL_ESCAPE_SEQUENCES[character];
          hexResult = 0;

          for (hexIndex = 1; hexIndex <= hexLength; hexIndex += 1) {
            hexOffset = (hexLength - hexIndex) * 4;
            character = input.charCodeAt(++position);

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

          result += String.fromCharCode(hexResult);
          character = input.charCodeAt(++position);

        } else {
          throwParseError('unknown escape sequence');
        }
        
        captureStart = position;

      } else if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        captureSegment(captureStart, findContentEnd(captureStart), true);
        performFlowFolding(indent);
        captureStart = position;
        character = input.charCodeAt(position);

      } else {
        character = input.charCodeAt(++position);
      }
    }

    throwParseError('unexpected end of the stream within a double quoted scalar');
  }

  function readFlowCollection(indent) {
    var _result, _line, following,
        terminator, isMapping, readNext = true,
        node1, node2, pair, isPair, isExplicitPair;

    switch (character) {
    case CHAR_LEFT_SQUARE_BRACKET:
      terminator = CHAR_RIGHT_SQUARE_BRACKET;
      isMapping = false;
      _result = [];
      break;

    case CHAR_LEFT_CURLY_BRACKET:
      terminator = CHAR_RIGHT_CURLY_BRACKET;
      isMapping = true;
      _result = {};
      break;

    default:
      return false;
    }

    character = input.charCodeAt(++position);

    while (position < length) {
      skipFlowSeparationSpace(indent);

      if (character === terminator) {
        result = _result;
        return true;
      } else if (!readNext) {
        throwParseError('a missed comma between collection entries');
      }

      node1 = node2 = null;
      isPair = isExplicitPair = false;

      if (CHAR_QUESTION === character) {
        following = input.charCodeAt(position + 1);

        if (CHAR_SPACE === following ||
            CHAR_TAB === following ||
            CHAR_LINE_FEED === following ||
            CHAR_CARRIAGE_RETURN === following) {
          isPair = isExplicitPair = true;
          position += 1;
          character = following;
          skipFlowSeparationSpace(indent);
        }
      }

      _line = line;
      readNode(indent);
      node1 = result;

      if ((isExplicitPair || line === _line) && CHAR_COLON === character) {
        isPair = true;
        character = input.charCodeAt(++position);
        skipFlowSeparationSpace(indent);
        readNode(indent);
        node2 = result;
      }

      if (isMapping || isPair) {
        node1 = String(node1);
      }

      if (isMapping) {
        if (safeMode && _hasOwn.call(_result, node1)) {
          throwParseError('duplication of a mapping key');
        }
        _result[node1] = node2;
      } else if (isPair) {
        pair = {};
        pair[node1] = node2;
        _result.push(pair);
      } else {
        _result.push(node1);
      }

      skipFlowSeparationSpace(indent);

      if (CHAR_COMMA === character) {
        readNext = true;
        character = input.charCodeAt(++position);
      } else {
        readNext = false;
      }
    }

    throwParseError('unexpected end of the stream within a flow collection');
  }

  function readNode(indent) {
    if (!(readSingleQuotedScalar(indent) ||
          readDoubleQuotedScalar(indent) ||
          readFlowCollection(indent))) {
      throwParseError('can not determine type of a node under the cursor');
    }
  }

  if (safeMode) {
    if (/[^\x09\x0A\x0D -~\x85\xA0-\uD7FF\uE000-\uFFFD]/.test(input)) {
      throwParseError('the stream contains non-printable characters');
    }
  }

  readNode(0);
  return result;
};
