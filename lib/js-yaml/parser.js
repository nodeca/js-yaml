'use strict';


var util = require('util');
var common = require('./common');
var NIL = common.NIL;
var defaultSchema = require('./schema/default');
var _hasOwn = Object.prototype.hasOwnProperty;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var CHAR_TAB                  = 0x09;   /* Tab */
var CHAR_LINE_FEED            = 0x0A;   /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D;   /* CR */
var CHAR_SPACE                = 0x20;   /* Space */
var CHAR_EXCLAMATION          = 0x21;   /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22;   /* " */
var CHAR_SHARP                = 0x23;   /* # */
var CHAR_DOLLAR               = 0x24;   /* $ */
var CHAR_PERCENT              = 0x25;   /* % */
var CHAR_AMPERSAND            = 0x26;   /* & */
var CHAR_SINGLE_QUOTE         = 0x27;   /* ' */
var CHAR_LEFT_PARENTHESIS     = 0x28;   /* ( */
var CHAR_RIGHT_PARENTHESIS    = 0x29;   /* ) */
var CHAR_ASTERISK             = 0x2A;   /* * */
var CHAR_PLUS                 = 0x2B;   /* + */
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
var CHAR_SEMICOLON            = 0x3B;   /* ; */
var CHAR_LESS_THAN            = 0x3C;   /* < */
var CHAR_EQUALITY             = 0x3D;   /* = */
var CHAR_GREATER_THAN         = 0x3E;   /* > */
var CHAR_QUESTION             = 0x3F;   /* ? */
var CHAR_COMMERCIAL_AT        = 0x40;   /* @ */
var CHAR_CAPITAL_A            = 0x41;   /* A */
var CHAR_CAPITAL_F            = 0x46;   /* F */
var CHAR_CAPITAL_L            = 0x4C;   /* L */
var CHAR_CAPITAL_N            = 0x4E;   /* N */
var CHAR_CAPITAL_P            = 0x50;   /* P */
var CHAR_CAPITAL_U            = 0x55;   /* U */
var CHAR_CAPITAL_Z            = 0x5A;   /* Z */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B;   /* [ */
var CHAR_BACKSLASH            = 0x5C;   /* \ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D;   /* ] */
var CHAR_UNDERSCORE           = 0x5F;   /* _ */
var CHAR_GRAVE_ACCENT         = 0x60;   /* ` */
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
var CHAR_SMALL_Z              = 0x7A;   /* z */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B;   /* { */
var CHAR_VERTICAL_LINE        = 0x7C;   /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D;   /* } */
var CHAR_TILDE                = 0x7E;   /* ~ */
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
SIMPLE_ESCAPE_SEQUENCES[CHAR_SPACE]        = ' ';
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
  var schema     = defaultSchema,
      length     = input.length,
      position   = 0,
      line       = 0,
      lineStart  = 0,
      lineIndent = 0,
      character  = input.charCodeAt(position),
      safeMode   = true,
      legacyMode,
      implicitResolvers,
      explicitResolvers,
      directiveHandlers = {},
      tagMap,
      result,
      tag,
      documentsCollection = null;

  if (undefined !== settings && null !== settings) {
    if (undefined !== settings.safe && null !== settings.safe) {
      safeMode = settings.safe;
    }
  }

  if (undefined !== settings && null !== settings) {
    if (undefined !== settings.schema && null !== settings.schema) {
      schema = settings.schema;
    }
  }

  implicitResolvers = schema.compileImplicit(null);
  explicitResolvers = schema.compileExplicit(null);

  // NOTE: This is just a stub.
  function output(node) {
    if (null === documentsCollection) {
      documentsCollection = node;
    } else if (!Array.isArray(documentsCollection)) {
      documentsCollection = [ documentsCollection, node ];
    } else {
      documentsCollection.push(node);
    }
  }

  directiveHandlers['YAML'] = function handleYamlDirective(name, args) {
    var match, major, minor;

    if (1 !== args.length) {
      throwParseError('YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (null === match) {
      throwParseError('ill-formed argument of a YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (1 !== major) {
      throwParseError('unacceptable YAML version of a document');
    }

    legacyMode = (minor < 2);

    if (1 !== minor && 2 !== minor) {
      throwParseWarning('unsupported YAML version of a document');
    }
  };

  directiveHandlers['TAG'] = function handleTagDirective(name, args) {
    var handle, prefix;

    if (2 !== args.length) {
      throwParseError('TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if ('!' !== handle &&
        '!!' !== handle &&
        !(/^![a-z\-]+!$/i.test(handle))) {
      throwParseError('ill-formed tag handle (first argument) of a TAG directive');
    }

    if (!(/^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i.test(prefix))) {
      throwParseError('ill-formed tag prefix (second argument) of a TAG directive');
    }

    tagMap[handle] = prefix;
  };

  function throwParseError(message) {
    throw new Error(
      util.format(
        'JS-YAML error: %s at position %d (line %d, column %d)',
        message || '(unknown reason)',
        position,
        line + 1,
        position - lineStart + 1));
  }

  function throwParseWarning(message) {
    console.warn(
      'JS-YAML warning: %s at position %d (line %d, column %d)',
      message || '(unknown reason)',
      position,
      line + 1,
      position - lineStart + 1);
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

  function storeMappingPair(mapping, key, value) {
    key = String(key);

    if (null === mapping) {
      mapping = {};
    } else if (safeMode && _hasOwn.call(mapping, key)) {
      throwParseError('duplication of a mapping key');
    }

    mapping[key] = value;
    
    return mapping;
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
    lineStart = position;
    character = input.charCodeAt(position);
  }

  function skipSeparationSpace(expectedIndent) {
    var atNewLine = false;

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
        atNewLine = true;
        lineIndent = 0;

        while ((-1 === expectedIndent || lineIndent < expectedIndent) &&
               (CHAR_SPACE === character)) {
          lineIndent += 1;
          character = input.charCodeAt(++position);
        }

        if (-1 !== expectedIndent && lineIndent < expectedIndent) {
          throwParseError('deficient indentation');
        }
      } else {
        break;
      }
    }

    return atNewLine;
  }

  // NOTE: This function must be called on a line break. Flow scalar readers
  // must treat line's trailing whitespaces by themselves.
  function performFlowFolding(expectedIndent, ensureIndented) {
    var actualIndent, emptyLines = -1, goodIndented = true;

    while (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
      emptyLines += 1;
      readLineBreak();
      actualIndent = 0;

      // Read indent of a line.
      while (actualIndent < expectedIndent && CHAR_SPACE === character) {
        actualIndent += 1;
        character = input.charCodeAt(++position);
      }

      if (actualIndent < expectedIndent &&
          CHAR_LINE_FEED !== character &&
          CHAR_CARRIAGE_RETURN !== character) {
        goodIndented = false;
        if (ensureIndented) {
          throwParseError('deficient indentation within a flow node');
        }
      }

      // Skip the line's prefix and/or empty line content.
      while (CHAR_SPACE === character || CHAR_TAB === character) {
        character = input.charCodeAt(++position);
      }
    }

    if (goodIndented) {
      if (emptyLines === 0) {
        result += ' ';
      } else if (emptyLines > 0) {
        do {
          result += '\n';
          emptyLines -= 1;
        } while (emptyLines > 0);
      }
    }

    return goodIndented;
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

  function readPlainScalar(nodeIndent, withinFlowNode) {
    var preceding, following, captureStart, captureEnd, _line;

    if (CHAR_SPACE === character ||
        CHAR_TAB === character ||
        CHAR_LINE_FEED === character ||
        CHAR_CARRIAGE_RETURN === character ||
        CHAR_COMMA === character ||
        CHAR_LEFT_SQUARE_BRACKET === character ||
        CHAR_RIGHT_SQUARE_BRACKET === character ||
        CHAR_LEFT_CURLY_BRACKET === character ||
        CHAR_RIGHT_CURLY_BRACKET === character ||
        CHAR_SHARP === character ||
        CHAR_AMPERSAND === character ||
        CHAR_ASTERISK === character ||
        CHAR_EXCLAMATION === character ||
        CHAR_VERTICAL_LINE === character ||
        CHAR_GREATER_THAN === character ||
        CHAR_SINGLE_QUOTE === character ||
        CHAR_DOUBLE_QUOTE === character ||
        CHAR_PERCENT === character ||
        CHAR_COMMERCIAL_AT === character ||
        CHAR_GRAVE_ACCENT === character) {
      return false;
    }

    if (CHAR_QUESTION === character ||
        CHAR_COLON === character ||
        CHAR_HYPHEN === character) {
      following = input.charCodeAt(position + 1);

      if (CHAR_SPACE === following ||
          CHAR_TAB === following ||
          CHAR_LINE_FEED === following ||
          CHAR_CARRIAGE_RETURN === following ||
          withinFlowNode &&
          (CHAR_COMMA === following ||
           CHAR_LEFT_SQUARE_BRACKET === following ||
           CHAR_RIGHT_SQUARE_BRACKET === following ||
           CHAR_LEFT_CURLY_BRACKET === following ||
           CHAR_RIGHT_CURLY_BRACKET === following)) {
        return false;
      }
    }

    result = '';
    tag = '?';
    captureStart = position;
    character = input.charCodeAt(++position);
    captureEnd = position;

    while (position < length) {
      if (CHAR_COLON === character) {
        following = input.charCodeAt(position + 1);
     
        if (CHAR_SPACE === following ||
            CHAR_TAB === following ||
            CHAR_LINE_FEED === following ||
            CHAR_CARRIAGE_RETURN === following ||
            withinFlowNode &&
            (CHAR_COMMA === following ||
             CHAR_LEFT_SQUARE_BRACKET === following ||
             CHAR_RIGHT_SQUARE_BRACKET === following ||
             CHAR_LEFT_CURLY_BRACKET === following ||
             CHAR_RIGHT_CURLY_BRACKET === following)) {
          break;
        }

      } else if (CHAR_SHARP === character) {
        preceding = input.charCodeAt(position - 1);

        if (CHAR_SPACE === preceding ||
            CHAR_TAB === preceding ||
            CHAR_LINE_FEED === preceding ||
            CHAR_CARRIAGE_RETURN === preceding) {
          break;
        }
        
      } else if (withinFlowNode &&
                 (CHAR_COMMA === character ||
                  CHAR_LEFT_SQUARE_BRACKET === character ||
                  CHAR_RIGHT_SQUARE_BRACKET === character ||
                  CHAR_LEFT_CURLY_BRACKET === character ||
                  CHAR_RIGHT_CURLY_BRACKET === character)) {
        break;
        
      } else if (CHAR_LINE_FEED === character ||
                 CHAR_CARRIAGE_RETURN === character) {
        captureSegment(captureStart, captureEnd, false);
        _line = line;
        
        if (performFlowFolding(nodeIndent, false)) {
          captureStart = captureEnd = position;
        } else {
          position = captureEnd;
          line = _line;
          character = input.charCodeAt(position);
          return true;
        }

      } else if (CHAR_SPACE !== character &&
                 CHAR_TAB !== character) {
        captureEnd = position + 1;
      }

      character = input.charCodeAt(++position);
    }

    captureSegment(captureStart, captureEnd, false);

    return true;
  }

  function readSingleQuotedScalar(nodeIndent) {
    var captureStart;

    if (CHAR_SINGLE_QUOTE !== character) {
      return false;
    }

    result = '';
    tag = '!';
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
        performFlowFolding(nodeIndent, true);
        captureStart = position;
        character = input.charCodeAt(position);

      } else {
        character = input.charCodeAt(++position);
      }
    }

    throwParseError('unexpected end of the stream within a single quoted scalar');
  }
  
  function readDoubleQuotedScalar(nodeIndent) {
    var captureStart, hexLength, hexIndex, hexOffset, hexResult;

    if (CHAR_DOUBLE_QUOTE !== character) {
      return false;
    }

    result = '';
    tag = '!';
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
          performFlowFolding(nodeIndent, true);

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
        performFlowFolding(nodeIndent, true);
        captureStart = position;
        character = input.charCodeAt(position);

      } else {
        character = input.charCodeAt(++position);
      }
    }

    throwParseError('unexpected end of the stream within a double quoted scalar');
  }

  function readFlowCollection(nodeIndent) {
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
      skipSeparationSpace(nodeIndent);

      if (character === terminator) {
        character = input.charCodeAt(++position);
        result = _result;
        tag = '!';
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
          skipSeparationSpace(nodeIndent);
        }
      }

      _line = line;
      composeNode(nodeIndent, true);
      node1 = result;

      if ((isExplicitPair || line === _line) && CHAR_COLON === character) {
        isPair = true;
        character = input.charCodeAt(++position);
        skipSeparationSpace(nodeIndent);
        composeNode(nodeIndent, true);
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

      skipSeparationSpace(nodeIndent);

      if (CHAR_COMMA === character) {
        readNext = true;
        character = input.charCodeAt(++position);
      } else {
        readNext = false;
      }
    }

    throwParseError('unexpected end of the stream within a flow collection');
  }

  function readBlockScalar(nodeIndent) {
    var captureStart,
        folding,
        chomping       = CHOMPING_CLIP,
        detectedIndent = false,
        textIndent     = nodeIndent + 1,
        emptyLines     = -1;

    switch (character) {
    case CHAR_VERTICAL_LINE:
      folding = false;
      break;

    case CHAR_GREATER_THAN:
      folding = true;
      break;

    default:
      return false;
    }

    result = '';
    tag = '!';

    while (position < length) {
      character = input.charCodeAt(++position);

      if (CHAR_PLUS === character || CHAR_HYPHEN === character) {
        if (CHOMPING_CLIP === chomping) {
          chomping = (CHAR_PLUS === character) ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwParseError('repeat of a chomping mode identifier');
        }

      } else if (CHAR_DIGIT_ZERO <= character && character <= CHAR_DIGIT_NINE) {
        if (CHAR_DIGIT_ZERO === character) {
          throwParseError('bad explicit indentation width of a block scalar; it cannot be less than one');
        } else if (!detectedIndent) {
          textIndent = nodeIndent + (character - CHAR_DIGIT_ONE) + 1;
          detectedIndent = true;
        } else {
          throwParseError('repeat of an indentation width identifier');
        }

      } else {
        break;
      }
    }

    if (CHAR_SPACE === character || CHAR_TAB === character) {
      do { character = input.charCodeAt(++position); }
      while (CHAR_SPACE === character || CHAR_TAB === character);

      if (CHAR_SHARP === character) {
        do { character = input.charCodeAt(++position); }
        while (position < length &&
               CHAR_LINE_FEED !== character &&
               CHAR_CARRIAGE_RETURN !== character);
      }
    }
      
    while (position < length) {
      readLineBreak();
      lineIndent = 0;

      while ((!detectedIndent || lineIndent < textIndent) &&
             (CHAR_SPACE === character)) {
        lineIndent += 1;
        character = input.charCodeAt(++position);
      }

      if (!detectedIndent && lineIndent > textIndent) {
        textIndent = lineIndent;
      }

      if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        emptyLines += 1;
        continue;
      }

      // End of the scalar. Perform the chomping.
      if (lineIndent < textIndent) {
        if (CHOMPING_KEEP === chomping) {
          result += common.repeat('\n', emptyLines + 1);
        } else if (CHOMPING_CLIP === chomping) {
          result += '\n';
        }
        break;
      }

      detectedIndent = true;

      if (folding) {
        if (CHAR_SPACE === character || CHAR_TAB === character) {
          result += common.repeat('\n', emptyLines + 1);
          emptyLines = 1;
        } else if (0 === emptyLines) {
          result += ' ';
          emptyLines = 0;
        } else {
          result += common.repeat('\n', emptyLines);
          emptyLines = 0;
        }
      } else {
        result += common.repeat('\n', emptyLines + 1);
        emptyLines = 0;
      }

      captureStart = position;

      do { character = input.charCodeAt(++position); }
      while (position < length &&
             CHAR_LINE_FEED !== character &&
             CHAR_CARRIAGE_RETURN !== character);

      captureSegment(captureStart, position, false);
    }

    return true;
  }

  // TODO: Cleanup.
  function readBlockSequence(nodeIndent) {
    var following, _nodeIndent, _result = [], detected = false;

    while (position < length) {
      if (CHAR_HYPHEN !== character) {
        break;
      }

      following = input.charCodeAt(position + 1);

      if (CHAR_SPACE !== following &&
          CHAR_TAB !== following &&
          CHAR_LINE_FEED !== following &&
          CHAR_CARRIAGE_RETURN !== following) {
        break;
      }

      detected = true;
      position += 1;
      character = following;
      _nodeIndent = nodeIndent + 1;

      while (CHAR_SPACE === character) {
        _nodeIndent += 1;
        character = input.charCodeAt(++position);
      }

      if (skipSeparationSpace(-1)) {
        if (lineIndent > nodeIndent) {
          _nodeIndent = lineIndent;
        } else if (lineIndent === nodeIndent) {
          continue;
        } else {
          throwParseError('unexpected content');
        }
      }

      if (composeNode(_nodeIndent, false)) {
        _result.push(result);
      } else {
        _result.push(null);
      }

      if (skipSeparationSpace(-1)) {
        if (lineIndent === nodeIndent) {
          continue;
        } else if (lineIndent < nodeIndent) {
          break;
        } else {
          throwParseError('unexpected content');
        }
      }
    }

    if (detected) {
      result = _result;
      tag = '!';
      return true;
    } else {
      return false;
    }
  }

  function readBlockMapping(nodeIndent) {
    var following,
        _nodeIndent,
        _line,
        _result       = null,
        keyNode       = null,
        valueNode     = null,
        atExplicitKey = false,
        detected      = false;

    while (position < length) {
      following = input.charCodeAt(position + 1);
      _line = line; // Save the current line.
      _nodeIndent = nodeIndent + 1;

      if ((CHAR_QUESTION === character ||
           CHAR_COLON === character) &&
          (CHAR_SPACE === following ||
           CHAR_TAB === following ||
           CHAR_LINE_FEED === following ||
           CHAR_CARRIAGE_RETURN === following)) {

        if (CHAR_QUESTION === character) {
          if (atExplicitKey) {
            _result = storeMappingPair(_result, keyNode, null);
            keyNode = null;
            valueNode = null;
          }

          detected = true;
          atExplicitKey = true;

        } else if (atExplicitKey) {
          // i.e. CHAR_COLON === character after the explicit key.
          atExplicitKey = false;
          
        } else {
          throwParseError('incomplete explicit mapping pair; a key node is missed');
        }

        position += 1;
        character = following;

        while (CHAR_SPACE === character) {
          _nodeIndent += 1;
          character = input.charCodeAt(++position);
        }
        
      } else if (composeNode(nodeIndent, true)) {
        if (line === _line) {
          // TODO: Remove this cycle when the flow readers will consume
          // trailing whitespaces like the block readers.
          while (CHAR_SPACE === character ||
                 CHAR_TAB === character) {
            character = input.charCodeAt(++position);
          }

          if (CHAR_COLON === character) {
            character = input.charCodeAt(++position);

            if (CHAR_SPACE !== character &&
                CHAR_TAB !== character &&
                CHAR_LINE_FEED !== character &&
                CHAR_CARRIAGE_RETURN !== character) {
              throwParseError('a whitespace character is expected after the key-value separator within a block mapping');
            }

            if (atExplicitKey) {
              _result = storeMappingPair(_result, keyNode, null);
              keyNode = null;
              valueNode = null;
            }

            detected = true;
            atExplicitKey = false;
            keyNode = result;

          } else if (detected) {
            throwParseError('can not read an implicit mapping pair; a colon is missed');

          } else {
            return true; // Keep the result of `composeNode`.
          }

        } else if (detected) {
          throwParseError('can not read a block mapping entry; a multiline key may not be an implicit key');
          
        } else {
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwParseError('cannot read a block mapping entry');
        
      } else {
        return false;
      }

      if (skipSeparationSpace(-1)) {
        _nodeIndent = lineIndent;
      }

      if (_nodeIndent > nodeIndent) {
        if (composeNode(_nodeIndent, false)) {
          if (atExplicitKey) {
            keyNode = result;
          } else {
            valueNode = result;
          }
        }
        
        if (!atExplicitKey) {
          _result = storeMappingPair(_result, keyNode, valueNode);
          keyNode = null;
          valueNode = null;
        }
        
        // TODO: It is needed only for flow node readers. It should be removed
        // when the flow readers will consume trailing whitespaces as well as
        // the block readers.
        skipSeparationSpace(-1);
      }

      if (lineIndent > nodeIndent && position < length) {
        throwParseError('bad indentation of a mapping entry');
      } else if (lineIndent < nodeIndent) {
        break;
      }
    }

    if (atExplicitKey) {
      _result = storeMappingPair(_result, keyNode, null);
    }

    result = _result;
    tag = '!';
    return true;
  }

  function readTagProperty() {
    var _position,
        isVerbatim = false,
        isNamed    = false,
        tagHandle,
        tagName,
        checkIndex,
        checkLength,
        checkCharacter;
    
    if (CHAR_EXCLAMATION !== character) {
      return false;
    }

    character = input.charCodeAt(++position);

    if (CHAR_LESS_THAN === character) {
      isVerbatim = true;
      character = input.charCodeAt(++position);

    } else if (CHAR_EXCLAMATION === character) {
      isNamed = true;
      tagHandle = '!!';
      character = input.charCodeAt(++position);

    } else {
      tagHandle = '!';
    }

    _position = position;

    if (isVerbatim) {
      do { character = input.charCodeAt(++position); }
      while (position < length && CHAR_GREATER_THAN !== character);

      if (position < length) {
        tagName = input.slice(_position, position);
        character = input.charCodeAt(++position);
      } else {
        throwParseError('unexpected end of the stream within a verbatim tag');
      }
    } else {
      while (position < length &&
             CHAR_SPACE !== character &&
             CHAR_TAB !== character &&
             CHAR_LINE_FEED !== character &&
             CHAR_CARRIAGE_RETURN !== character) {

        if (CHAR_EXCLAMATION === character) {
          if (!isNamed) {
            tagHandle = input.slice(_position, position);

            if (safeMode) {
              for (checkIndex = 0, checkLength = tagHandle.length;
                   checkIndex < checkLength;
                   checkIndex += 1) {

                checkCharacter = tagHandle.charCodeAt(checkIndex);

                if (!((CHAR_HYPHEN === checkCharacter) ||
                      (CHAR_DIGIT_ZERO <= checkCharacter && checkCharacter <= CHAR_DIGIT_NINE) ||
                      (CHAR_SMALL_A <= checkCharacter && checkCharacter <= CHAR_SMALL_Z) ||
                      (CHAR_CAPITAL_A <= checkCharacter && checkCharacter <= CHAR_CAPITAL_Z))) {
                  throwParseError('named tag handle cannot contain such characters');
                }
              }
            }

            isNamed = true;
            tagHandle = '!' + tagHandle + '!';
            _position = position + 1;
          } else {
            throwParseError('tag suffix cannot contain exclamation marks');
          }
        }

        character = input.charCodeAt(++position);
      }

      if (_hasOwn.call(tagMap, tagHandle)) {
        tagName = input.slice(_position, position);

        if (safeMode) {
          for (checkIndex = 0, checkLength = tagName.length;
               checkIndex < checkLength;
               checkIndex += 1) {

            checkCharacter = tagName.charCodeAt(checkIndex);

            if (CHAR_COMMA === checkCharacter ||
                CHAR_LEFT_SQUARE_BRACKET === checkCharacter ||
                CHAR_RIGHT_SQUARE_BRACKET === checkCharacter ||
                CHAR_LEFT_CURLY_BRACKET === checkCharacter ||
                CHAR_RIGHT_CURLY_BRACKET === checkCharacter) {
              throwParseError('tag suffix cannot contain flow indicator characters');
            }
          }
        }
      } else {
        throwParseError('an undeclared tag handle');
      }
    }

    if (safeMode) {
      for (checkIndex = 0, checkLength = tagName.length;
           checkIndex < checkLength;
           checkIndex += 1) {
        checkCharacter = tagName.charCodeAt(checkIndex);

        if (!((CHAR_PERCENT === checkCharacter) ||
              (CHAR_SHARP === checkCharacter) ||
              (CHAR_SEMICOLON === checkCharacter) ||
              (CHAR_SLASH === checkCharacter) ||
              (CHAR_QUESTION === checkCharacter) ||
              (CHAR_COLON === checkCharacter) ||
              (CHAR_COMMERCIAL_AT === checkCharacter) ||
              (CHAR_AMPERSAND === checkCharacter) ||
              (CHAR_EQUALITY === checkCharacter) ||
              (CHAR_PLUS === checkCharacter) ||
              (CHAR_DOLLAR === checkCharacter) ||
              (CHAR_COMMA === checkCharacter) ||
              (CHAR_UNDERSCORE === checkCharacter) ||
              (CHAR_DOT === checkCharacter) ||
              (CHAR_EXCLAMATION === checkCharacter) ||
              (CHAR_TILDE === checkCharacter) ||
              (CHAR_ASTERISK === checkCharacter) ||
              (CHAR_SINGLE_QUOTE === checkCharacter) ||
              (CHAR_LEFT_PARENTHESIS === checkCharacter) ||
              (CHAR_RIGHT_PARENTHESIS === checkCharacter) ||
              (CHAR_LEFT_SQUARE_BRACKET === checkCharacter) ||
              (CHAR_RIGHT_SQUARE_BRACKET === checkCharacter) ||
              (CHAR_HYPHEN === checkCharacter) ||
              (CHAR_DIGIT_ZERO <= checkCharacter && checkCharacter <= CHAR_DIGIT_NINE) ||
              (CHAR_SMALL_A <= checkCharacter && checkCharacter <= CHAR_SMALL_Z) ||
              (CHAR_CAPITAL_A <= checkCharacter && checkCharacter <= CHAR_CAPITAL_Z))) {
          throwParseError('tag name cannot contain such characters');
        }
      }
    }

    if (isVerbatim) {
      result = tagName;
    } else {
      result = tagMap[tagHandle] + tagName;
    }

    return true;
  }

  // FIXME: Tag forwarding for implicit block mappings.
  function composeNode(nodeIndent, withinFlowNode) {
    var detected = false, _tag = null, _result, index, amount;

    if (readTagProperty()) {
      _tag = result;

      if (skipSeparationSpace(-1)) {
        if (lineIndent < nodeIndent) {
          detected = true;
          result = null;
        }
      }
    }

    if (!detected) {
      if (withinFlowNode) {
        detected = readPlainScalar(nodeIndent, withinFlowNode) ||
                   readSingleQuotedScalar(nodeIndent) ||
                   readDoubleQuotedScalar(nodeIndent) ||
                   readFlowCollection(nodeIndent);
      } else {
        detected = readBlockScalar(nodeIndent) ||
                   readBlockSequence(nodeIndent) ||
                   readBlockMapping(nodeIndent);
      }
    }

    if (null !== _tag) {
      tag = _tag;
    }

    if ('!' !== tag) {
      if ('?' === tag) {
        for (index = 0, amount = implicitResolvers.length;
             index < amount;
             index += 1) {
          _result = implicitResolvers[index].resolver(result, false);

          if (NIL !== _result) {
            result = _result;
            break;
          }
        }
      } else if (_hasOwn.call(explicitResolvers, tag)) {
        _result = explicitResolvers[tag].resolver(result, true);

        if (NIL !== _result) {
          result = _result;
        } else {
          throwParseError('a node with an explicit tag <' + tag + '> cannot be interpreted');
        }
      } else {
        throwParseWarning('ignoring unknown tag <' + tag + '>');
      }
    }

    return detected;
  }

  function readDocument() {
    var _position, directiveName, directiveArgs, hasDirectives = false;

    legacyMode = false;

    tagMap = {
      '!'  : '!',
      '!!' : 'tag:yaml.org,2002:'
    };

    while (position < length) {
      skipSeparationSpace(-1);

      if (lineIndent > 0 || CHAR_PERCENT !== character) {
        break;
      }

      hasDirectives = true;
      character = input.charCodeAt(++position);
      _position = position;

      while (position < length &&
             CHAR_SPACE !== character &&
             CHAR_TAB !== character &&
             CHAR_LINE_FEED !== character &&
             CHAR_CARRIAGE_RETURN !== character) {
        character = input.charCodeAt(++position);
      }

      directiveName = input.slice(_position, position);
      directiveArgs = [];

      if (directiveName.length < 1) {
        throwParseError('directive name must not be less than one character in length');
      }

      while (position < length) {
        while (CHAR_SPACE === character || CHAR_TAB === character) {
          character = input.charCodeAt(++position);
        }

        if (CHAR_SHARP === character) {
          do { character = input.charCodeAt(++position); }
          while (position < length &&
                 CHAR_LINE_FEED !== character &&
                 CHAR_CARRIAGE_RETURN !== character);
          break;
        }

        if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
          break;
        }

        _position = position;

        while (position < length &&
               CHAR_SPACE !== character &&
               CHAR_TAB !== character &&
               CHAR_LINE_FEED !== character &&
               CHAR_CARRIAGE_RETURN !== character) {
          character = input.charCodeAt(++position);
        }

        directiveArgs.push(input.slice(_position, position));
      }

      if (position < length) {
        readLineBreak();
      }

      if (_hasOwn.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](directiveName, directiveArgs);
      } else {
        throwParseWarning('unknown document directive ' + directiveName);
      }
    }

    skipSeparationSpace(-1);

    if (0 === lineIndent &&
        CHAR_HYPHEN === character &&
        CHAR_HYPHEN === input.charCodeAt(position + 1) &&
        CHAR_HYPHEN === input.charCodeAt(position + 2)) {
      position += 3;
      character = input.charCodeAt(position);
      skipSeparationSpace(-1);
    } else if (hasDirectives) {
      throwParseError('directives end mark is expected');
    }

    composeNode(lineIndent, false);
    output(result);

    skipSeparationSpace(-1);

    if (0 === lineIndent) {
      if (CHAR_HYPHEN === character &&
          CHAR_HYPHEN === input.charCodeAt(position + 1) &&
          CHAR_HYPHEN === input.charCodeAt(position + 2)) {
        return;

      } else if (CHAR_DOT === character &&
                 CHAR_DOT === input.charCodeAt(position + 1) &&
                 CHAR_DOT === input.charCodeAt(position + 2)) {
        position += 3;
        character = input.charCodeAt(position);
        skipSeparationSpace(-1);
        return;
      }
    }

    if (position < length) {
      throwParseError('end of the stream end or a document separator is expected');
    } else {
      return;
    }
  }

  if (safeMode) {
    if (/[^\x09\x0A\x0D -~\x85\xA0-\uD7FF\uE000-\uFFFD]/.test(input)) {
      throwParseError('the stream contains non-printable characters');
    }
  }

  while (CHAR_SPACE === character) {
    lineIndent += 1;
    character = input.charCodeAt(++position);
  }

  while (position < length) {
    readDocument();
  }

  return documentsCollection;
};
