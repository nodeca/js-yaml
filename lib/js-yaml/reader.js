'use strict';


var JS = global.JS,
    exports = module.exports = {},
    fs = require('fs'),
    __ = require('./core').import('error');


JS.require('JS.Class');


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
    return  'unacceptable character ' + this.character + ': ' + this.reason +
            '\n in "' + this.name + '", position ' + this.position;
  }
});


exports.Reader = new JS.Class('Reader', {
  extend: {
    __init__: function (self, stream) {
      self.name = '<unicode string>';
      self.stream = null;
      self.streamPointer = 0;
      self.eof = true;
      self.buffer = '';
      self.pointer = 0;
      self.rawBuffer = null;
      self.encoding = 'utf-8';
      self.index = 0;
      self.line = 0;
      self.column = 0;

      if ('string' === typeof stream) { // simple string
        self.name = '<unicode string>';
        self.checkPrintable(stream);
        self.buffer = stream + '\0';
      } else if (Buffer.isBuffer(stream)) { // buffer
        self.name = '<buffer>';
        self.rawBuffer = stream;
        self.update(1);
      } else { // file descriptor
        self.name = '<file>';
        self.stream = stream;
        self.eof = false;
        self.updateRaw();
        self.update(1);
      }
    }
  },

  initialize: function (stream) {
    exports.Reader.__init__(this, stream);
  },

  peek: function (index) {
    var data;

    index = +index || 0;
    data =  this.buffer[this.pointer + index];

    if (undefined === data) {
      this.update(index + 1);
      data = this.buffer[this.pointer + index];
    }

    return data;
  },

  prefix: function (length) {
    length = +length || 1;
    if (this.pointer + length >= this.buffer.length) {
      this.update(length);
    }
    return this.buffer.slice(this.pointer, this.pointer + length);
  },

  forward: function (length) {
    var ch;

    // WARNING!!! length default is <int:1>, but method cn be called with
    //            <int:0> which is absolutely NOT default length value, so
    //            that's why we have ternary operator instead of lazy assign.
    length = (undefined !== length) ? (+length) : 1;

    if (this.pointer + length + 1 >= this.buffer.length) {
      this.update(length + 1);
    }

    while (length) {
      ch = this.buffer[this.pointer];
      this.pointer++;
      this.index++;

      if (0 <= '\n\x85\u2028\u2029'.indexOf(ch)
          || ('\r' === ch && '\n' !== this.buffer[this.pointer])) {
        this.line++;
        this.column = 0;
      } else if (ch !== '\uFEFF') {
        this.column++;
      }

      length--;
    }
  },

  getMark: function () {
    if (null === this.stream) {
      return new __.Mark(this.name, this.index, this.line, this.column,
                         this.buffer, this.pointer);
    } else {
      return new __.Mark(this.name, this.index, this.line, this.column,
                         null, null);
    }
  },


  checkPrintable: function (data) {
    var match = data.toString().match(NON_PRINTABLE), position;
    if (match) {
      position = this.index + this.buffer.length - this.pointer + match.index;
      throw new ReaderError(this.name, position, match[0],
                            'unicode', 'special characters are not allowed');
    }
  },

  update: function (length) {
    var data;

    if (null === this.rawBuffer) {
      return;
    }

    this.buffer = this.buffer.slice(this.pointer);
    this.pointer = 0;

    while (this.buffer.length < length) {
      if (!this.eof) {
        this.updateRaw();
      }

      data = this.rawBuffer;

      this.checkPrintable(data);
      this.buffer += data;
      this.rawBuffer = this.rawBuffer.slice(data.length);

      if (this.eof) {
        this.buffer += '\0';
        this.rawBuffer = null;
        break;
      }
    }
  },

  updateRaw: function (size) {
    var data = new Buffer(+size || 4096),
        count = fs.readSync(this.stream, data, 0, data.length),
        tmp;

    if (null === this.rawBuffer) {
      this.rawBuffer = data.slice(0, count);
    } else {
      tmp = new Buffer(this.rawBuffer.length + count);
      this.rawBuffer.copy(tmp);
      data.copy(tmp, this.rawBuffer.length);
      this.rawBuffer = tmp;
    }

    this.streamPointer += count;

    if (!count) {
      this.eof = true;
    }
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
