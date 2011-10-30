'use strict';


var JS = global.JS,
    exports = module.exports = {};


JS.require('JS.Class');


var HASHIFY_KEYS = ['anchor', 'tag', 'implicit', 'value'];


exports.Event = new JS.Class('Event', {
  initialize: function (startMark, endMark) {
    this.startMark = startMark || null;
    this.endMark = endMark || null;
  },
  hash: function () {
    var values = [], self = this;
    
    Object.getOwnPropertyNames(this).forEach(function (key) {
      if (0 <= HASHIFY_KEYS.indexOf(key)) {
        values.push(key + '=' + self[key]);
      }
    });

    return this.klass + '(' + values.join(', ') + ')';
  }
});


exports.NodeEvent = new JS.Class('NodeEvent', exports.Event, {
  initialize: function (anchor, startMark, endMark) {
    this.anchor = anchor;
    this.startMark = startMark || null;
    this.endMark = endMark || null;
  }
});


exports.CollectionStartEvent = new JS.Class('CollectionStartEvent', exports.NodeEvent, {
  initialize: function (anchor, tag, implicit, startMark, endMark, flowStyle) {
    this.anchor = anchor;
    this.tag = tag;
    this.implicit = implicit;
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.flowStyle = flowStyle || null;
  }
});


exports.CollectionEndEvent = new JS.Class('CollectionEndEvent', exports.Event, {});


exports.StreamStartEvent = new JS.Class('StreamStartEvent', exports.Event, {
  initialize: function (startMark, endMark, encoding) {
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.encoding = encoding || null;
  }
});


exports.StreamEndEvent = new JS.Class('StreamEndEvent', exports.Event, {});


exports.DocumentStartEvent = new JS.Class('DocumentStartEvent', exports.Event, {
  initialize: function (startMark, endMark, explicit, version, tags) {
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.explicit = explicit || null;
    this.version = version || null;
    this.tags = tags || null;
  }
});


exports.DocumentEndEvent = new JS.Class('DocumentEndEvent', exports.Event, {
  initialize: function (startMark, endMark, explicit) {
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.explicit = explicit || null;
  }
});


exports.AliasEvent = new JS.Class('AliasEvent', exports.NodeEvent, {});


exports.ScalarEvent = new JS.Class('ScalarEvent', exports.NodeEvent, {
  initialize: function (anchor, tag, implicit, value, startMark, endMark, style) {
    this.anchor = anchor;
    this.tag = tag;
    this.implicit = implicit;
    this.value = value;
    this.startMark = startMark || null;
    this.endMark = endMark || null;
    this.style = style || null;
  }
});


exports.SequenceStartEvent = new JS.Class('SequenceStartEvent', exports.CollectionStartEvent, {});
exports.SequenceEndEvent = new JS.Class('SequenceEndEvent', exports.CollectionEndEvent, {});
exports.MappingStartEvent = new JS.Class('MappingStartEvent', exports.CollectionStartEvent, {});
exports.MappingEndEvent = new JS.Class('MappingEndEvent', exports.CollectionEndEvent, {});

////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
