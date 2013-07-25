'use strict';


var common              = require('./common');
var NIL                 = common.NIL;
var YAMLException       = require('./exception');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');


var _hasOwnProperty = Object.prototype.hasOwnProperty;


var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */


var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var QUOTED_SEQUENCES = [
  0x00,
  0x07,
  0x08,
  0x0B,
  0x0C,
  0x1B,
  0x5C,
  0x85,
  0xA0,
  0x2028,
  0x2029
];

function kindOf(object) {
  var kind = typeof object;

  if (null === object) {
    return 'null';
  } else if ('number' === kind) {
    return 0 === object % 1 ? 'integer' : 'float';
  } else if ('object' === kind && Array.isArray(object)) {
    return 'array';
  } else {
    return kind;
  }
}


function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (null === map) {
    return {};
  }

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if ('!!' === tag.slice(0, 2)) {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }

    type = schema.compiledTypeMap[tag];

    if (type && type.dumper) {
      if (_hasOwnProperty.call(type.dumper.styleAliases, style)) {
        style = type.dumper.styleAliases[style];
      }
    }

    result[tag] = style;
  }

  return result;
}


function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}


function dump(input, options) {
  options = options || {};

  var schema      = options['schema'] || DEFAULT_FULL_SCHEMA,
      indent      = Math.max(1, (options['indent'] || 2)),
      skipInvalid = options['skipInvalid'] || false,
      flowLevel   = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']),
      styleMap    = compileStyleMap(schema, options['styles'] || null),

      implicitTypes = schema.compiledImplicit,
      explicitTypes = schema.compiledExplicit,

      kind,
      tag,
      result;

  function generateNextLine(level) {
    return '\n' + common.repeat(' ', indent * level);
  }

  function testImplicitResolving(object) {
    var index, length, type;

    for (index = 0, length = implicitTypes.length; index < length; index += 1) {
      type = implicitTypes[index];

      if (null !== type.loader &&
          NIL !== type.loader.resolver(object, false)) {
        return true;
      }
    }

    return false;
  }

  function writeScalarFull(level, object) {
    var chomp, style, checkpoint, position, length, character;

    var STYLE_PLAIN                 = 0;
    var STYLE_SINGLE                = 1;
    var STYLE_QUOTED_UNLESS_LITERAL = 2;
    var STYLE_LITERAL               = 3;
    var STYLE_QUOTED                = 4;

    result = '';
    style = STYLE_PLAIN;
    checkpoint = 0;

    if (0          === object.length ||
        CHAR_SPACE === object.charCodeAt(0) ||
        CHAR_SPACE === object.charCodeAt(object.length - 1)) {
      style = STYLE_SINGLE;
    }

    for (position = 0, length = object.length; position < length; position += 1) {
      if (style >= STYLE_QUOTED) {
        break;
      }

      character = object.charCodeAt(position);

      // Certain characters which usually trigger quoting/escaping are
      // allowed by the literal style. These characters will result in
      // quoting unless the style is otherwise escalated to (but not beyond)
      // the literal style.
      if (style <= STYLE_QUOTED_UNLESS_LITERAL &&
        ( CHAR_DOUBLE_QUOTE        === character ||
          CHAR_COLON               === character ||
          CHAR_LEFT_SQUARE_BRACKET === character ||
          CHAR_LEFT_CURLY_BRACKET  === character)) {
        style = STYLE_QUOTED_UNLESS_LITERAL;
        continue;
      }

      // Escalate style to literal.
      if (style <= STYLE_LITERAL &&
        ( CHAR_TAB             === character ||
          CHAR_LINE_FEED       === character ||
          CHAR_CARRIAGE_RETURN === character)) {
        style = STYLE_LITERAL;
        continue;
      }

      // Escalate style to quoted.
      if (QUOTED_SEQUENCES.indexOf(character) >= 0 ||
          !((0x00020 <= character && character <= 0x00007E) ||
            (0x00085 === character)                         ||
            (0x000A0 <= character && character <= 0x00D7FF) ||
            (0x0E000 <= character && character <= 0x00FFFD) ||
            (0x10000 <= character && character <= 0x10FFFF))) {
        style = STYLE_QUOTED;
        continue;
      }
    }

    // Resolves to quoted at this point.
    if (style === STYLE_QUOTED_UNLESS_LITERAL) {
      style = STYLE_QUOTED;
    }

    for (position = 0, length = object.length; position < length; position += 1) {
      character = object.charCodeAt(position);
      if (style === STYLE_LITERAL) {
        if (character === CHAR_LINE_FEED ||
            character === CHAR_CARRIAGE_RETURN) {
          result += object.slice(checkpoint, position);
          checkpoint = position + 1;
          if (position < length - 1) {
            result += generateNextLine(level);
          }
        }
      }
      if (style === STYLE_QUOTED) {
        if (ESCAPE_SEQUENCES[character] ||
            !((0x00020 <= character && character <= 0x00007E) ||
              (0x00085 === character)                         ||
              (0x000A0 <= character && character <= 0x00D7FF) ||
              (0x0E000 <= character && character <= 0x00FFFD) ||
              (0x10000 <= character && character <= 0x10FFFF))) {
          result += object.slice(checkpoint, position);
          result += ESCAPE_SEQUENCES[character] || encodeHex(character);
          checkpoint = position + 1;
        }
      }
    }

    if (checkpoint < position) {
      result += object.slice(checkpoint, position);
    }

    if (style === STYLE_SINGLE) {
      result = "'" + result + "'";
    }
    if (style === STYLE_LITERAL) {
      if (object.charCodeAt(object.length - 1) !== CHAR_LINE_FEED) {
        chomp = '|-';
      } else if (object.charCodeAt(object.length - 2) !== CHAR_LINE_FEED) {
        chomp = '|';
      } else {
        chomp = '|+';
      }
      result = chomp + generateNextLine(level) + result;
    }
    if (style === STYLE_QUOTED) {
      result = '"' + result + '"';
    }
  }

  function writeScalar(object) {
    var isQuoted, checkpoint, position, length, character;

    result = '';
    isQuoted = false;
    checkpoint = 0;

    if (0          === object.length ||
        CHAR_SPACE === object.charCodeAt(0) ||
        CHAR_SPACE === object.charCodeAt(object.length - 1)) {
      isQuoted = true;
    }

    for (position = 0, length = object.length; position < length; position += 1) {
      character = object.charCodeAt(position);

      if (!isQuoted) {
        if (CHAR_TAB                  === character ||
            CHAR_LINE_FEED            === character ||
            CHAR_CARRIAGE_RETURN      === character ||
            CHAR_COMMA                === character ||
            CHAR_LEFT_SQUARE_BRACKET  === character ||
            CHAR_RIGHT_SQUARE_BRACKET === character ||
            CHAR_LEFT_CURLY_BRACKET   === character ||
            CHAR_RIGHT_CURLY_BRACKET  === character ||
            CHAR_SHARP                === character ||
            CHAR_AMPERSAND            === character ||
            CHAR_ASTERISK             === character ||
            CHAR_EXCLAMATION          === character ||
            CHAR_VERTICAL_LINE        === character ||
            CHAR_GREATER_THAN         === character ||
            CHAR_SINGLE_QUOTE         === character ||
            CHAR_DOUBLE_QUOTE         === character ||
            CHAR_PERCENT              === character ||
            CHAR_COMMERCIAL_AT        === character ||
            CHAR_GRAVE_ACCENT         === character ||
            CHAR_QUESTION             === character ||
            CHAR_COLON                === character ||
            CHAR_MINUS                === character) {
          isQuoted = true;
        }
      }

      if (ESCAPE_SEQUENCES[character] ||
          !((0x00020 <= character && character <= 0x00007E) ||
            (0x00085 === character)                         ||
            (0x000A0 <= character && character <= 0x00D7FF) ||
            (0x0E000 <= character && character <= 0x00FFFD) ||
            (0x10000 <= character && character <= 0x10FFFF))) {
        result += object.slice(checkpoint, position);
        result += ESCAPE_SEQUENCES[character] || encodeHex(character);
        checkpoint = position + 1;
        isQuoted = true;
      }
    }

    if (checkpoint < position) {
      result += object.slice(checkpoint, position);
    }

    if (!isQuoted && testImplicitResolving(result)) {
      isQuoted = true;
    }

    if (isQuoted) {
      result = '"' + result + '"';
    }
  }

  function writeFlowSequence(level, object) {
    var _result = '',
        _tag    = tag,
        index,
        length;

    for (index = 0, length = object.length; index < length; index += 1) {
      // Write only valid elements.
      if (writeNode(level, object[index], false, false)) {
        if (0 !== index) {
          _result += ', ';
        }
        _result += result;
      }
    }

    tag = _tag;
    result = '[' + _result + ']';
  }

  function writeBlockSequence(level, object, compact) {
    var _result = '',
        _tag    = tag,
        index,
        length;

    for (index = 0, length = object.length; index < length; index += 1) {
      // Write only valid elements.
      if (writeNode(level + 1, object[index], true, true, true)) {
        if (!compact || 0 !== index) {
          _result += generateNextLine(level);
        }
        _result += '- ' + result;
      }
    }

    tag = _tag;
    result = _result || '[]'; // Empty sequence if no valid values.
  }

  function writeFlowMapping(level, object) {
    var _result       = '',
        _tag          = tag,
        objectKeyList = Object.keys(object),
        index,
        length,
        objectKey,
        objectValue,
        pairBuffer;

    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = '';

      if (0 !== index) {
        pairBuffer += ', ';
      }

      objectKey = objectKeyList[index];
      objectValue = object[objectKey];

      if (!writeNode(level, objectKey, false, false)) {
        continue; // Skip this pair because of invalid key;
      }

      if (result.length > 1024) {
        pairBuffer += '? ';
      }

      pairBuffer += result + ': ';

      if (!writeNode(level, objectValue, false, false)) {
        continue; // Skip this pair because of invalid value.
      }

      pairBuffer += result;

      // Both key and value are valid.
      _result += pairBuffer;
    }

    tag = _tag;
    result = '{' + _result + '}';
  }

  function writeBlockMapping(level, object, compact) {
    var _result       = '',
        _tag          = tag,
        objectKeyList = Object.keys(object),
        index,
        length,
        objectKey,
        objectValue,
        explicitPair,
        pairBuffer;

    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = '';

      if (!compact || 0 !== index) {
        pairBuffer += generateNextLine(level);
      }

      objectKey = objectKeyList[index];
      objectValue = object[objectKey];

      if (!writeNode(level + 1, objectKey, true, true)) {
        continue; // Skip this pair because of invalid key.
      }

      explicitPair = (null !== tag && '?' !== tag && result.length <= 1024);

      if (explicitPair) {
        pairBuffer += '? ';
      }

      pairBuffer += result;

      if (explicitPair) {
        pairBuffer += generateNextLine(level);
      }

      if (!writeNode(level + 1, objectValue, true, explicitPair, true)) {
        continue; // Skip this pair because of invalid value.
      }

      pairBuffer += ': ' + result;

      // Both key and value are valid.
      _result += pairBuffer;
    }

    tag = _tag;
    result = _result || '{}'; // Empty mapping if no valid pairs.
  }

  function detectType(object, explicit) {
    var _result, typeList, index, length, type, style;

    typeList = explicit ? explicitTypes : implicitTypes;
    kind = kindOf(object);

    for (index = 0, length = typeList.length; index < length; index += 1) {
      type = typeList[index];

      if ((null !== type.dumper) &&
          (null === type.dumper.kind       || kind === type.dumper.kind) &&
          (null === type.dumper.instanceOf || object instanceof type.dumper.instanceOf) &&
          (null === type.dumper.predicate  || type.dumper.predicate(object))) {
        tag = explicit ? type.tag : '?';

        if (null !== type.dumper.representer) {
          style = styleMap[type.tag] || type.dumper.defaultStyle;

          if ('function' === typeof type.dumper.representer) {
            _result = type.dumper.representer(object, style);
          } else if (_hasOwnProperty.call(type.dumper.representer, style)) {
            _result = type.dumper.representer[style](object, style);
          } else {
            throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
          }

          if (NIL !== _result) {
            kind = kindOf(_result);
            result = _result;
          } else {
            if (explicit) {
              throw new YAMLException('cannot represent an object of !<' + type.tag + '> type');
            } else {
              continue;
            }
          }
        }

        return true;
      }
    }

    return false;
  }

  // Serializes `object` and writes it to global `result`.
  // Returns true on success, or false on invalid object.
  //
  function writeNode(level, object, block, compact, fullscalar) {
    tag = null;
    result = object;

    if (!detectType(object, false)) {
      detectType(object, true);
    }

    if (block) {
      block = (0 > flowLevel || flowLevel > level);
    }

    if ((null !== tag && '?' !== tag) || (2 !== indent && level > 0)) {
      compact = false;
    }

    if ('object' === kind) {
      if (block && (0 !== Object.keys(result).length)) {
        writeBlockMapping(level, result, compact);
      } else {
        writeFlowMapping(level, result);
      }
    } else if ('array' === kind) {
      if (block && (0 !== result.length)) {
        writeBlockSequence(level, result, compact);
      } else {
        writeFlowSequence(level, result);
      }
    } else if ('string' === kind) {
      if ('?' !== tag) {
        if (fullscalar) {
          writeScalarFull(level, result);
        } else {
          writeScalar(result);
        }
      }
    } else if (skipInvalid) {
      return false;
    } else {
      throw new YAMLException('unacceptabe kind of an object to dump (' + kind + ')');
    }

    if (null !== tag && '?' !== tag) {
      result = '!<' + tag + '> ' + result;
    }
    return true;
  }

  if (writeNode(0, input, true, true, true)) {
    return result + '\n';
  } else {
    return '';
  }
}


function safeDump(input, options) {
  return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


module.exports.dump     = dump;
module.exports.safeDump = safeDump;
