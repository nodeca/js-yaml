JS.require('JS.Class');


var __ = require('./import')('error');


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
    this.name = null;
    this.stream = null;
    this.streamPointer = 0;
    this.eof = true;
    this.buffer = '';
    this.pointer = 0;
    this.rawBuffer = null;
    this.rawDecode = null;
    this.encoding = null;
    this.index = 0;
    this.line = 0;
    this.column = 0;
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
