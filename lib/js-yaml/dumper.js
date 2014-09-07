'use strict';


var common              = require('./common');
var YAMLException       = require('./exception');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');


var _toString       = Object.prototype.toString;
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


var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];


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

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
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


function State(options) {
  this.schema      = options['schema'] || DEFAULT_FULL_SCHEMA;
  this.indent      = Math.max(1, (options['indent'] || 2));
  this.skipInvalid = options['skipInvalid'] || false;
  this.flowLevel   = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap    = compileStyleMap(this.schema, options['styles'] || null);

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.objectList      = [];
  this.firstAppearance = [];
  this.repeated        = [];
  this.level           = [];

  this.currentPosition = 0;
}


function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

function writeScalar(state, object) {
  var isQuoted, checkpoint, position, length, character, first;

  state.dump = '';
  isQuoted = false;
  checkpoint = 0;
  first = object.charCodeAt(0) || 0;

  if (-1 !== DEPRECATED_BOOLEANS_SYNTAX.indexOf(object)) {
    // Ensure compatibility with YAML 1.0/1.1 loaders.
    isQuoted = true;
  } else if (0 === object.length) {
    // Quote empty string
    isQuoted = true;
  } else if (CHAR_SPACE    === first ||
             CHAR_SPACE    === object.charCodeAt(object.length - 1)) {
    isQuoted = true;
  } else if (CHAR_MINUS    === first ||
             CHAR_QUESTION === first) {
    // Don't check second symbol for simplicity
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
          CHAR_COLON                === character ||
          CHAR_GRAVE_ACCENT         === character) {
        isQuoted = true;
      }
    }

    if (ESCAPE_SEQUENCES[character] ||
        !((0x00020 <= character && character <= 0x00007E) ||
          (0x00085 === character)                         ||
          (0x000A0 <= character && character <= 0x00D7FF) ||
          (0x0E000 <= character && character <= 0x00FFFD) ||
          (0x10000 <= character && character <= 0x10FFFF))) {
      state.dump += object.slice(checkpoint, position);
      state.dump += ESCAPE_SEQUENCES[character] || encodeHex(character);
      checkpoint = position + 1;
      isQuoted = true;
    }
  }

  if (checkpoint < position) {
    state.dump += object.slice(checkpoint, position);
  }

  if (!isQuoted && testImplicitResolving(state, state.dump)) {
    isQuoted = true;
  }

  if (isQuoted) {
    state.dump = '"' + state.dump + '"';
  }
}

function writeFlowSequence(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectIndex   = state.objectList.indexOf(object),
      resultPointer = state.currentPosition + 1, //add the opening bracket
      index,
      length;

  if (objectIndex >= 0) {
    _result += '*ref' + objectIndex;
    state.repeated[objectIndex] = true;
    state.dump = _result;
  }
  else {
    state.objectList.push(object);
    state.firstAppearance.push(state.currentPosition);
    state.repeated.push(false);
    state.level.push(level);
    for (index = 0, length = object.length; index < length; index += 1) {
      state.currentPosition = resultPointer;
      if (0 !== index) {
        state.currentPosition += 2;
      }
      // Write only valid elements.
      if (writeNode(state, level, object[index], false, false)) {
        if (0 !== index) {
          _result += ', ';
          resultPointer += 2;
        }
        _result += state.dump;
        resultPointer += state.dump.length;
      }
    }

    state.tag = _tag;
    state.dump = '[' + _result + ']';
  }
}

function writeBlockSequence(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectIndex   = state.objectList.indexOf(object),
      resultPointer = state.currentPosition,
      index,
      length,
      newLine;

  if (objectIndex >= 0) {
    _result += '*ref' + objectIndex;
    state.repeated[objectIndex] = true;
    state.dump = _result;
  }
  else {
    state.objectList.push(object);
    state.firstAppearance.push(state.currentPosition);
    state.repeated.push(false);
    state.level.push(level);
    for (index = 0, length = object.length; index < length; index += 1) {
      state.currentPosition = resultPointer;
      if (!compact || 0 !== index) {
        state.currentPosition += generateNextLine(state, level).length;
      }
      state.currentPosition += 2; //Moving for '- ' marker
      // Write only valid elements.
      if (writeNode(state, level + 1, object[index], true, true)) {
        if (!compact || 0 !== index) {
          newLine = generateNextLine(state, level);
          _result += newLine;
          resultPointer += newLine.length;
        }
        resultPointer += 2;
        _result += '- ' + state.dump;
        resultPointer += state.dump.length;
      }
    }

    state.tag = _tag;
    state.dump = _result || '[]'; // Empty sequence if no valid values.
  }
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      objectIndex   = state.objectList.indexOf(object),
      resultPointer = state.currentPosition + 1, //Add the opening bracket
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  if (objectIndex >= 0) {
    _result += '*ref' + objectIndex;
    state.repeated[objectIndex] = true;
    state.dump = _result;
  }
  else {
    state.objectList.push(object);
    state.firstAppearance.push(state.currentPosition);
    state.repeated.push(false);
    state.level.push(level);
    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = '';

      if (0 !== index) {
        pairBuffer += ', ';
      }

      objectKey = objectKeyList[index];
      objectValue = object[objectKey];

      if (!writeNode(state, level, objectKey, false, false)) {
        continue; // Skip this pair because of invalid key;
      }

      if (state.dump.length > 1024) {
        pairBuffer += '? ';
      }

      pairBuffer += state.dump + ': ';

      state.currentPosition = resultPointer + pairBuffer.length;
      if (!writeNode(state, level, objectValue, false, false)) {
        continue; // Skip this pair because of invalid value.
      }

      pairBuffer += state.dump;

      // Both key and value are valid.
      _result += pairBuffer;
      state.currentPosition += pairBuffer.length;
    }

    state.tag = _tag;
    state.dump = '{' + _result + '}';
  }
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      objectIndex   = state.objectList.indexOf(object),
      resultPointer = state.currentPosition,
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  if (objectIndex >= 0) {
    _result += '*ref' + objectIndex;
    state.repeated[objectIndex] = true;
    state.dump = _result;
  }
  else {
    state.objectList.push(object);
    state.firstAppearance.push(state.currentPosition);
    state.repeated.push(false);
    state.level.push(level);
    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = '';

      if (!compact || 0 !== index) {
        pairBuffer += generateNextLine(state, level);
      }

      objectKey = objectKeyList[index];
      objectValue = object[objectKey];

      if (!writeNode(state, level + 1, objectKey, true, true)) {
        continue; // Skip this pair because of invalid key.
      }

      explicitPair = (null !== state.tag && '?' !== state.tag) ||
                     (state.dump && state.dump.length > 1024);

      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += '?';
        } else {
          pairBuffer += '? ';
        }
      }

      pairBuffer += state.dump;

      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }

      state.currentPosition = resultPointer + pairBuffer.length + 1; //Add ':'
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue; // Skip this pair because of invalid value.
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ':';
      } else {
        pairBuffer += ': ';
      }

      pairBuffer += state.dump;

      // Both key and value are valid.
      _result += pairBuffer;
      state.currentPosition += pairBuffer.length;
    }

    state.tag = _tag;
    state.dump = _result || '{}'; // Empty mapping if no valid pairs.
  }
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || (('object' === typeof object) && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      state.tag = explicit ? type.tag : '?';

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if ('[object Function]' === _toString.call(type.represent)) {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);

  if (block) {
    block = (0 > state.flowLevel || state.flowLevel > level);
  }

  if ((null !== state.tag && '?' !== state.tag) || (2 !== state.indent && level > 0)) {
    compact = false;
  }

  if ('[object Object]' === type) {
    if (block && (0 !== Object.keys(state.dump).length)) {
      writeBlockMapping(state, level, state.dump, compact);
    } else {
      writeFlowMapping(state, level, state.dump);
    }
  } else if ('[object Array]' === type) {
    if (block && (0 !== state.dump.length)) {
      writeBlockSequence(state, level, state.dump, compact);
    } else {
      writeFlowSequence(state, level, state.dump);
    }
  } else if ('[object String]' === type) {
    if ('?' !== state.tag) {
      writeScalar(state, state.dump);
    }
  } else if (state.skipInvalid) {
    return false;
  } else {
    throw new YAMLException('unacceptable kind of an object to dump ' + type);
  }

  if (null !== state.tag && '?' !== state.tag) {
    state.dump = '!<' + state.tag + '> ' + state.dump;
  }
  return true;
}


function dump(input, options) {
  options = options || {};

  var state = new State(options);

  if (writeNode(state, 0, input, true, true)) {
    addAliases(state);
    return state.dump + '\n';
  } else {
    return '';
  }
}


function safeDump(input, options) {
  return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}

function addAliases(state) {
  var index,
      position,
      beforeAlias,
      afterAlias;
  for (index = state.repeated.length - 1; index >= 0; index--) {
    if (state.repeated[index]) {
      position = state.firstAppearance[index];
      if (state.dump.charCodeAt(position) === CHAR_SPACE) {
        position += 1; //Solve distinction ':\n' and ': '
      }

      beforeAlias = '';
      if (position > 0 && state.dump.charCodeAt(position - 1) !== CHAR_SPACE) {
        beforeAlias = ' ';
      }

      afterAlias = '';
      if (state.dump.charCodeAt(position) === CHAR_LEFT_CURLY_BRACKET ||
          state.dump.charCodeAt(position) === CHAR_LEFT_SQUARE_BRACKET) {
        afterAlias = ' ';
      }
      else if (state.dump.charCodeAt(position) !== CHAR_LINE_FEED) {
        afterAlias = generateNextLine(state, state.level[index]);
      }

      state.dump = state.dump.slice(0, position) +
          beforeAlias + '&ref' + index + afterAlias +
          state.dump.slice(position);
    }
  }
}


module.exports.dump     = dump;
module.exports.safeDump = safeDump;
