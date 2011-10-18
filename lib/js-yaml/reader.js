JS.require('JS.Class');


var __ = require('./import')('error');
var NON_PRINTABLE = new RegExp('[^\x09\x0A\x0D\x20-\x7E\x85\xA0-\uD7FF\uE000-\uFFFD]');


var ReaderError = exports.ReaderError = new JS.Class('ReaderError', __.YAMLError, {
  initialize: function (name, position, character, encoding, reason) {
    this.name = name;
    this.position = position;
    this.character = character;
    this.encoding = encoding;
    this.reason = reason;
  },

  toString: function () {
    return "ReaderError not implemented yet"
  }
});


exports.Reader = new JS.Class('Reader', {
  initialize: function (stream) {
    this.name = '<unicode string>';
    this.stream = null;
    this.streamPointer = 0;
    this.eof = true;
    this.buffer = '';
    this.pointer = 0;
    this.rawBuffer = null;
    this.rawDecode = null;
    this.encoding = '';
    this.index = 0;
    this.line = 0;
    this.column = 0;

    if ('string' === typeof stream) { // simple string
      this.name = '<unicode string>';
      this.checkPrintable(stream);
      this.buffer = stream + '\0';
    } else if (Buffer.isBuffer(stream)) { // buffer
      this.name = '<buffer>';
      this.rawBuffer = stream;
      this.encoding = 'utf-8';
      this.update(1);
    } else { // file descriptor
      this.name = '<file>';
      this.stream = stream;
      this.eof = false;
      this.updateRaw();
      this.update(1);
    }
  },

  forward: function (length) {
    var char;

    length = +length || 1;

    if (this.pointer+length >= this.buffer.length) {
      this.update(length);
    }

    while (length) {
      char = this.buffer[this.pointer];
      this.pointer++;
      this.index++;
      if (/^[\n\x85\u2028\u2029]$/.test(char)
          || ('\r' == char && '\n' != this.buffer[this.pointer])) {
        this.line++;
        this.column = 0;
      } else if (!/^\uFEFF$/.test(char)) {
        this.column++;
      }
      length--;
    }
  },

  getStream: function () {
    if (null === this.stream) {
      return new __.Mark(this.name, this.index, this.line, this.column,
                         this.buffer, this.pointer);
    } else {
      return new __.Mark(this.name, this.index, this.line, this.column,
                         null, null);
    }
  },

  update: function (length) {
    if (null === this.rawBuffer) {
      return;
    }

    this.buffer = this.buffer.slice(this.pointer);
    this.pointer = 0;

    while (this.buffer.length < length) {
      if (!this.eof) {
        this.updateRaw();
      }
      if (null !== this.rawDecode) {
        try {
          decoded = this.rawDecode(this.rawBuffer, 'strict', this.eof);
          data = decoded[0];
          converted = decoded[1];
        } catch (e) {
          character = this.rawBuffer[e.start];
        }
    }
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
