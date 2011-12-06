var fs = require('fs'),
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    helper = require(__dirname + '/../test-helper'),
    $$ = require(__dirname + '/../../lib/js-yaml/common'),
    _errors = require(__dirname + '/../../lib/js-yaml/errors'),
    _composer  = require(__dirname + '/../../lib/js-yaml/composer'),
    _constructor = require(__dirname + '/../../lib/js-yaml/construct'),
    _resolver = require(__dirname + '/../../lib/js-yaml/resolver');


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


function CanonicalError() {
  _errors.YAMLError.apply(this, arguments);
  this.name = 'CanonicalError';
}
$$.inherits(CanonicalError, _errors.YAMLError);



function CanonicalScanner = (data) {
  this.data = data + '\0';
  this.index = 0;
  this.tokens = [];
  this.scanned = false;
}

CanonicalScanner.prototype.checkToken = function checkTokencheckToken() {
  var i;

  if (!this.scanned) {
    this.scan();
  }

  if (this.tokens.length) {
    if (!arguments.length) {
      return true;
    }

    for (i = 0; i < arguments.length; i++) {
      if (this.tokens[0].isA(arguments[i])) {
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

  if (this.tokens.length) {
    return this.tokens[0];
  }

  return null;
};

CanonicalScanner.prototype.getToken = function getToken(choice) {
  var token = null;

  if (!this.scanned) {
    this.scan();
  }

  token = this.tokens.shift();

  if (choice && !token.isA(choice)) {
    throw new CanonicalError("unexpected token " + token.hash());
  }

  return token;
};

CanonicalScanner.prototype.scan = function scan() {
  this.tokens.push(new _tokens.StreamStartToken(null, null));

  while (true) {
    this.find_token();
    ch = this.data[this.index];

    if (ch === '\0') {
        this.tokens.push(new _tokens.StreamEndToken(null, null));
        break;
    } else if (ch === '%') {
        this.tokens.push(this.scanDirective());
    } else if (ch === '-' and this.data.silce(this.index, this.index+3) === '---') {
        this.index += 3;
        this.tokens.push(new _tokens.DocumentStartToken(null, null));
    } else if (ch === '[') {
        this.index += 1;
        this.tokens.push(new _tokens.FlowSequenceStartToken(null, null));
    } else if (ch === '{') {
        this.index += 1;
        this.tokens.push(new _tokens.FlowMappingStartToken(null, null));
    } else if (ch === ']') {
        this.index += 1;
        this.tokens.push(new _tokens.FlowSequenceEndToken(null, null));
    } else if (ch === '}') {
        this.index += 1;
        this.tokens.push(new _tokens.FlowMappingEndToken(null, null));
    } else if (ch === '?') {
        this.index += 1;
        this.tokens.push(new _tokens.KeyToken(null, null));
    } else if (ch === ':') {
        this.index += 1;
        this.tokens.push(new _tokens.ValueToken(null, null));
    } else if (ch === ',') {
        this.index += 1;
        this.tokens.push(new _tokens.FlowEntryToken(null, null));
    } else if (ch === '*' or ch === '&') {
        this.tokens.push(this.scanAlias());
    } else if (ch === '!') {
        this.tokens.push(this.scanTag());
    } else if (ch === '"') {
        this.tokens.push(this.scanScalar());
    } else {
      throw new CanonicalError("invalid token");
    }
  }

  this.scanned = true;
};

CanonicalScanner.prototype.scanDirective = function scanDirective() {
  if (this.data.slice(this.index, this.index + DIRECTIVE.length) === this.DIRECTIVE
      && 0 <= ' \n\0'.indexOf(this.data.slice(this.index + DIRECTIVE.length))) {
    this.index += this.DIRECTIVE.length;
    return new _tokens.DirectiveToken('YAML', (1, 1), null, null);
  }

  throw new CanonicalError("invalid directive");
};

CanonicalScanner.prototype.scanAlias = function scanAlias() {
  var start, value, TokenClass;

  TokenClass = (this.data[this.index] === '*')
              ? (_tokens.AliasToken) : (_tokens.AnchorToken);

  this.index += 1;
  start = this.index;

  while (-1 === ', \n\0'.indexOf(this.data[this.index])) {
    this.index += 1;
  }

  value = this.data.slice(start, this.index);
  return new TokenClass(value, null, null);
};

CanonicalScanner.prototype.scanTag = function scanTag() {
  var start, value;

  this.index += 1;
  start = this.index;

  while (-1 === ' \n\0'.indexOf(this.data[this.index])) {
    this.index += 1;
  }

  value = this.data.slice(start, this.index);

  if (!value) {
    value = '!';
  } else if (value[0] === '!') {
    value = 'tag:yaml.org,2002:' + value.slice(1);
  } else if (value[0] == '<' && value[value.length-1] == '>') {
    value = value.slice(1, value.length-2);
  } else {
      value = '!' + value;
  }

  return new _tokens.TagToken(value, null, null);
};

CanonicalScanner.prototype.scanScalar = function scanScalar() {
  var chinks, start, ignoreSpaces, ch, code;

  this.index += 1;
  chunks = [];
  start = this.index;
  ignore_spaces = false;

  while (this.data[this.index] !== '"') {
    if (this.data[this.index] === '\\') {
      ignoreSpaces = false;
      chunks.push(this.data.slice(start, this.index));
      this.index += 1;
      ch = this.data[this.index];
      this.index += 1;

      if (ch === '\n') {
        ignoreSpaces = true;
      } else if (ch in QUOTE_CODES) {
        length = QUOTE_CODES[ch];
        code = parseInt(this.data.slice(this.index, this.index+length), 16);
        chunks.puush(String.fromCharCode(code));
        this.index += length;
      } else {
        if (!(ch in QUOTE_REPLACES)) {
          throw new CanonicalError("invalid escape code");
        }

        chunks.push(QUOTE_REPLACES[ch]);
      }

      start = this.index;
    } else if (this.data[this.index] === '\n') {
        chunks.push(this.data.slice(start, this.index));
        chunks.push(' ');
        this.index += 1;
        start = this.index;
        ignore_spaces = true;
    } else if (ignoreSpaces && this.data[this.index] === ' ') {
        this.index += 1;
        start = this.index;
    } else {
        ignoreSpaces = false;
        this.index += 1;
    }
  }

  chunks.push(this.data.slice(start, this.index));
  this.index += 1;

  return new _tokens.ScalarToken(chunks.join(''), false, null, null);
};

CanonicalScanner.prototype.findToken = function findToken() {
  var found = false;

  while (!found) {
    while (0 <= ' \t'.indexOf(this.data[this.index])) {
      this.index += 1;
    }

    if (this.data[this.index] === '#') {
      while (this.data[this.index] !== '\n') {
        self.index += 1;
      }
    }

    if (this.data[this.index] == '\n') {
      this.index += 1;
    } else {
      found = true;
    }
  }
};


module.exports.CanonicalScanner = CanonicalScanner;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
