'use strict';


var _tokens = require('../../lib/js-yaml/tokens');
var _common = require('./common');
var CanonicalError = require('./canonical-error');


var DIRECTIVE = '%YAML 1.1';


var QUOTE_CODES = {
  'x': 2,
  'u': 4,
  'U': 8
};


var QUOTE_REPLACES = {
  '\\': '\\',
  '\"': '\"',
  ' ': ' ',
  'a': '\x07',
  'b': '\x08',
  'e': '\x1B',
  'f': '\x0C',
  'n': '\x0A',
  'r': '\x0D',
  't': '\x09',
  'v': '\x0B',
  'N': '\u0085',
  'L': '\u2028',
  'P': '\u2029',
  '_': '_',
  '0': '\x00'
};


function CanonicalScanner(data) {
  this.data = data + '\x00';
  this.index = 0;
  this.tokens = [];
  this.scanned = false;
}

CanonicalScanner.prototype.dataChar = function dataChar(index) {
  if (_common.isNothing(index)) {
    index = this.index;
  }

  return this.data.charAt(index);
}

CanonicalScanner.prototype.dataSlice = function dataSlice(options) {
  var fromIndex, toIndex;

  fromIndex = toIndex = this.index;

  if (!_common.isNothing(options.from)) {
    fromIndex = options.from;
  }

  if (!_common.isNothing(options.length)) {
    toIndex = fromIndex + options.length;
  }
  
  if (!_common.isNothing(options.to)) {
    toIndex = options.to;
  }

  return this.data.slice(fromIndex, toIndex);
}

CanonicalScanner.prototype.checkToken = function checkToken(/* choices... */) {
  var index, TokenClass;

  if (!this.scanned) {
    this.scan();
  }

  if (0 < this.tokens.length) {
    if (0 >= arguments.length) {
      return true;
    }

    for (index = 0; index < arguments.length; index += 1) {
      TokenClass = arguments[index];

      if (_common.isInstanceOf(this.tokens[0], TokenClass)) {
        return true;
      }
    }
  }

  return false;
};

CanonicalScanner.prototype.peekToken = function peekToken() {
  if (!this.scanned) {
    this.scan();
  }

  if (0 < this.tokens.length) {
    return this.tokens[0];
  }

  return null;
};

CanonicalScanner.prototype.getToken = function getToken(choice) {
  var token;

  if (!this.scanned) {
    this.scan();
  }

  token = this.tokens.shift();

  if (choice && !_common.isInstanceOf(token, choice)) {
    throw new CanonicalError('Unexpected token ' + token.hash());
  }

  return token;
};

CanonicalScanner.prototype.getTokenValue = function getTokenValue() {
  return this.getToken().value;
};

CanonicalScanner.prototype.scan = function scan() {
  var ch;

  this.tokens.push(new _tokens.StreamStartToken());

  while (true) {
    this.findToken();
    ch = this.dataChar();

    if ('\x00' === ch) {

      this.tokens.push(new _tokens.StreamEndToken());
      break;

    } else if ('%' === ch) {

      this.tokens.push(this.scanDirective());

    } else if ('-' === ch && '---' === this.dataSlice({ length: 3 })) {

      this.index += 3;
      this.tokens.push(new _tokens.DocumentStartToken());

    } else if ('[' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.FlowSequenceStartToken());

    } else if ('{' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.FlowMappingStartToken());

    } else if (']' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.FlowSequenceEndToken());

    } else if ('}' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.FlowMappingEndToken());

    } else if ('?' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.KeyToken());

    } else if (':' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.ValueToken());

    } else if (',' === ch) {

      this.index += 1;
      this.tokens.push(new _tokens.FlowEntryToken());

    } else if ('*' === ch || '&' === ch) {

      this.tokens.push(this.scanAlias());

    } else if ('!' === ch) {

      this.tokens.push(this.scanTag());

    } else if ('"' === ch) {

      this.tokens.push(this.scanScalar());

    } else {

      throw new CanonicalError(
        'Invalid token ' + JSON.stringify(ch) + ' at position ' + this.index);

    }
  }

  this.scanned = true;
};

CanonicalScanner.prototype.scanDirective = function scanDirective() {
  var length = DIRECTIVE.length;

  if (DIRECTIVE === this.dataSlice({ length: length }) &&
      0 <= ' \n\x00'.indexOf(this.dataChar(this.index + length))) {

    this.index += length;
    return new _tokens.DirectiveToken('YAML', [ 1, 1 ]);

  } else {

    throw new CanonicalError("Invalid directive");
  }
};

CanonicalScanner.prototype.scanAlias = function scanAlias() {
  var start, value, TokenClass;

  if ('*' === this.dataChar()) {
    TokenClass = _tokens.AliasToken;
  } else {
    TokenClass = _tokens.AnchorToken;
  }

  this.index += 1;
  start = this.index;

  while (0 > ', \n\x00'.indexOf(this.dataChar())) {
    this.index += 1;
  }

  value = this.dataSlice({ from: start });
  
  return new TokenClass(value, null, null);
};

CanonicalScanner.prototype.scanTag = function scanTag() {
  var start, value;

  this.index += 1;
  start = this.index;

  while (0 > ' \n\x00'.indexOf(this.dataChar())) {
    this.index += 1;
  }

  value = this.dataSlice({ from: start });

  if (0 > value.length) {

    value = '!';

  } else if ('!' === value.charAt(0)) {

    value = 'tag:yaml.org,2002:' + value.slice(1);

  } else if ('<' === value.charAt(0) &&
             '>' === value.charAt(value.length - 1)) {

    value = value.slice(1, (value.length - 2));

  } else {

    value = '!' + value;
  }

  return new _tokens.TagToken(value, null, null);
};

CanonicalScanner.prototype.scanScalar = function scanScalar() {
  var chunks, start, ignoreSpaces, character, code, length;

  this.index += 1;
  chunks = [];
  start = this.index;
  ignoreSpaces = false;

  while ('"' !== this.dataChar()) {

    if ('\\' === this.dataChar()) {

      ignoreSpaces = false;
      chunks.push(this.dataSlice({ from: start }));
      this.index += 1;
      character = this.dataChar();
      this.index += 1;

      if ('\n' === character) {

        ignoreSpaces = true;

      } else if (QUOTE_CODES.hasOwnProperty(character)) {

        length = QUOTE_CODES[character];
        code = parseInt(this.dataSlice({ length: length }), 16);
        chunks.push(String.fromCharCode(code));
        this.index += length;

      } else if (QUOTE_REPLACES.hasOwnProperty(character)) {

        chunks.push(QUOTE_REPLACES[character]);

      } else {

        throw new CanonicalError(
          'Invalid escape code ' + JSON.stringify(character) +
          ' at position ' + this.index);
        
      }

      start = this.index;
      
    } else if ('\n' === this.dataChar()) {

      chunks.push(this.dataSlice({ from: start }));
      chunks.push(' ');
      this.index += 1;
      start = this.index;
      ignoreSpaces = true;

    } else if (ignoreSpaces && ' ' === this.dataChar()) {

      this.index += 1;
      start = this.index;

    } else {

      ignoreSpaces = false;
      this.index += 1;

    }
  }

  chunks.push(this.dataSlice({ from: start }));
  this.index += 1;

  return new _tokens.ScalarToken(chunks.join(''), false);
};

CanonicalScanner.prototype.findToken = function findToken() {
  var found = false;

  while (!found) {
    while (0 <= ' \t'.indexOf(this.dataChar())) {
      this.index += 1;
    }

    if ('#' === this.dataChar()) {
      while ('\n' !== this.dataChar()) {
        this.index += 1;
      }
    }

    if ('\n' === this.dataChar()) {
      this.index += 1;
    } else {
      found = true;
    }
  }
};


module.exports = CanonicalScanner;
