'use strict';


var JS = global.JS,
    exports = module.exports = {},
    __ = require('./core').import('types');


JS.require('JS.Class');


exports.Node = new JS.Class('Node', {
  initialize: function (tag, value, startMark, endMark) {
    this.tag = tag;
    this.value = value;
    this.startMark = startMark;
    this.endMark = endMark;
  },
  hash: function () {
    var value = this.value.toString();
    return this.klass + '(' + this.tag + ', ' + value + ')';
  }
});


exports.Node.include(__.Hashable);


exports.ScalarNode = new JS.Class('ScalarNode', exports.Node, {
  extend: { id: 'scalar' },
  initialize: function (tag, value, startMark, endMark, style) {
    this.tag = tag;
    this.value = value;
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.style = style || null;
  }
});


exports.CollectionNode = new JS.Class('CollectionNode', exports.Node, {
  initialize: function (tag, value, startMark, endMark, flowStyle) {
    this.tag = tag;
    this.value = value;
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.flowStyle = flowStyle || null;
  }
});


exports.SequenceNode = new JS.Class('SequenceNode', exports.CollectionNode, {
  extend: { id: 'sequence' }
});


exports.MappingNode = new JS.Class('MappingNode', exports.CollectionNode, {
  extend: { id: 'mapping' }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
