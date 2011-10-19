JS.require('JS.Class');


var __ = require('./import')('error', 'events', 'nodes');


var ComposerError = exports.ComposerError = new JS.Class('ComposerError', __.MarkedYAMLError, {});


exports.Composer = new JS.Class('Composer', {
  initialize: function () {
    this.anchors = {};
  },

  checkNode: function () {
    // Drop the STREAM-START event
    if (this.checkEvent(__.StreamStartEvent)) {
      this.getEvent();
    }

    // If there are more documents vailable?
    return !this.checkEvent(__.StreamEndEvent);
  },

  getNode: function () {
    // Get the root node of the next document.
    if (!this.checkEvent(__.StreamEndEvent)) {
      return this.composeDocument();
    }
  },

  getSingleNode: function () {
    var document = null;

    // Drop the STREAM-START event.
    this.get_event()

    // Compose a document if the stream is not empty.
    if (!this.checkEvent(__.StreamEndEvent)) {
        document = this.composeDocument();
    }

    // Ensure that the stream contains no more documents.
    if (!this.checkEvent(__.StreamEndEvent)) {
        throw new ComposerError("expected a single document in the stream",
                document.startMark, "but found another document",
                this.getEvent().startMark)
    }

    // Drop the STREAM-END event.
    this.getEvent();

    return document;
  },

  composeDocument: function () {
    var node;

    // Drop the DOCUMENT-START event.
    this.getEvent();

    // Compose the root node.
    node = this.composeNode(null, null);

    // Drop the DOCUMENT-END event.
    this.getEvent();

    this.anchors = {};
    return node;
  },

  composeNode: function (parent, index) {
    var event, anchor;

    if (this.checkEvent(__.AliasEvent)) {
      event = this.getEvent();
      anchor = event.anchor;

      if (undefined === this.anchors[anchor]) {
        throw new ComposerError(null, null, "found undefined alias " + anchor,
                                event.startMark);
      }

      return this.anchors[anchor];
    }

    event = this.peekEvent();
    anchor = event.anchor;

    if (null !== anchor && undefined !== this.anchors[anchor]) {
      throw new ComposerError("found duplicate anchor " + anchor + "; first occurence",
                              this.anchors[anchor].startMark, "second occurence",
                              event.startMark);
    }

    this.descendResolver(parent, index);

    if (this.checkEvent(__.ScalarEvent)) {
        node = this.composeScalarNode(anchor);
    } else if (this.checkEvent(__.SequenceStartEvent)) {
        node = this.composeSequenceNode(anchor);
    } else if (this.checkEvent(__.MappingStartEvent)) {
        node = this.composeMappingNode(anchor);
    }

    this.ascendResolver();
    return node;
  },

  composeScalarNode: function (anchor) {
    var event, tag, node;
    
    event = this.getEvent();
    tag = event.tag;

    if (null === tag || "!" == tag) {
      tag = this.resolve(__.ScalarNode, event.value, event.implicit);
    }

    node = new __.ScalarNode(tag, event.value, event.startMark, event.endMark,
                             event.style);

    if (null !== anchor) {
        this.anchors[anchor] = node;
    }

    return node;
  },

  composeSequenceNode: function (anchor) {
    var start_event, event, tag, node, index, end_event;

    start_event = this.getEvent();
    tag = start_event.tag;

    if (null === tag || "!" == tag) {
      tag = this.resolve(__.SequenceNode, null, start_event.implicit);
    }

    node = new __.SequenceNode(tag, [], start_event.startMark, null,
                               start_event.flowStyle);

    if (null !== anchor) {
        this.anchors[anchor] = node;
    }

    index = 0;

    while (!this.checkEvent(__.SequenceEndEvent)) {
      node.value.append(this.composeNode(node, index));
      index += 1;
    }

    end_event = this.getEvent();
    node.endMark = end_event.endMark;

    return node;
  },

  composeMappingNode: function (anchor) {
    var start_event, event, tag, node, item_key, item_value, end_event;

    start_event = this.getEvent();
    tag = start_event.tag;

    if (null === tag || "!" == tag) {
      tag = this.resolve(__.MappingNode, null, start_event.implicit);
    }

    node = new __.MappingNode(tag, [], start_event.startMark, null,
                              start_event.flowStyle);

    if (null !== anchor) {
        this.anchors[anchor] = node;
    }

    while (!this.checkEvent(__.MappingEndEvent)) {
        item_key = this.composeNode(node, null);
        item_value = this.composeNode(node, item_key);
        node.value.append((item_key, item_value));
    }

    end_event = this.getEvent();
    node.endMark = end_event.endMark;

    return node;
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
