'use strict';


var JS = global.JS,
    exports = module.exports = {},
    __ = require('./core').import('types');


JS.require('JS.Class');


exports.Token = new JS.Class('Token', {
  initialize: function (startMark, endMark) {
    this.startMark = startMark;
    this.endMark = endMark;
  },
  hash: function () {
    var values = [], self = this;
    
    Object.getOwnPropertyNames(this).forEach(function (key) {
      if (!/startMark|endMark|__meta__/.test(key)) {
        values.push(key + ':' + self[key]);
      }
    });

    return this.klass + '(' + values.join(', ') + ')';
  }
});


exports.Token.include(__.Hashable);


exports.DirectiveToken = new JS.Class('DirectiveToken', exports.Token, {
  extend: { id: '<directive>' },
  initialize: function (name, value, startMark, endMark) {
    this.name = name;
    this.value = value;
    this.startMark = startMark;
    this.endMark = endMark;
  }
});


exports.DocumentStartToken = new JS.Class('DocumentStartToken', exports.Token, {
  extend: { id: '<document start>' }
});


exports.DocumentEndToken = new JS.Class('DocumentEndToken', exports.Token, {
  extend: { id: '<document end>' }
});


exports.StreamStartToken = new JS.Class('StreamStartToken', exports.Token, {
  extend: { id: '<stream start>' },
  initialize: function (startMark, endMark, encoding) {
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.encoding = encoding || null;
  }
});


exports.StreamEndToken = new JS.Class('StreamEndToken', exports.Token, {
  extend: { id: '<stream end>' }
});


exports.BlockSequenceStartToken = new JS.Class('BlockSequenceStartToken', exports.Token, {
  extend: { id: '<block sequence start>' }
});


exports.BlockMappingStartToken = new JS.Class('BlockMappingStartToken', exports.Token, {
  extend: { id: '<block mapping start>' }
});


exports.BlockEndToken = new JS.Class('BlockEndToken', exports.Token, {
  extend: { id: '<block end>' }
});


exports.FlowSequenceStartToken = new JS.Class('FlowSequenceStartToken', exports.Token, {
  extend: { id: '[' }
});


exports.FlowMappingStartToken = new JS.Class('FlowMappingStartToken', exports.Token, {
  extend: { id: '{' }
});


exports.FlowSequenceEndToken = new JS.Class('FlowSequenceEndToken', exports.Token, {
  extend: { id: ']' }
});


exports.FlowMappingEndToken = new JS.Class('FlowMappingEndToken', exports.Token, {
  extend: { id: '}' }
});


exports.KeyToken = new JS.Class('KeyToken', exports.Token, {
  extend: { id: '?' }
});


exports.ValueToken = new JS.Class('ValueToken', exports.Token, {
  extend: { id: ':' }
});


exports.BlockEntryToken = new JS.Class('BlockEntryToken', exports.Token, {
  extend: { id: '-' }
});


exports.FlowEntryToken = new JS.Class('FlowEntryToken', exports.Token, {
  extend: { id: ',' }
});


exports.AliasToken = new JS.Class('AliasToken', exports.Token, {
  extend: { id: '<alias>' },
  initialize: function (value, startMark, endMark) {
    this.value = value;
    this.startMark = startMark;
    this.endMark = endMark;
  }
});


exports.AnchorToken = new JS.Class('AnchorToken', exports.Token, {
  extend: { id: '<anchor>' },
  initialize: function (value, startMark, endMark) {
    this.value = value;
    this.startMark = startMark;
    this.endMark = endMark;
  }
});


exports.TagToken = new JS.Class('TagToken', exports.Token, {
  extend: { id: '<tag>' },
  initialize: function (value, startMark, endMark) {
    this.value = value;
    this.startMark = startMark;
    this.endMark = endMark;
  }
});


exports.ScalarToken = new JS.Class('ScalarToken', exports.Token, {
  extend: { id: '<scalar>' },
  initialize: function (value, plain, startMark, endMark, style) {
    this.value = value;
    this.plain = plain;
    this.startMark = startMark;
    this.endMark = endMark;
    this.style = style || null;
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
