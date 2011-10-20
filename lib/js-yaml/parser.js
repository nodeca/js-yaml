// The following YAML grammar is LL(1) and is parsed by a recursive descent
// parser.
//
// stream            ::= STREAM-START implicit_document? explicit_document* STREAM-END
// implicit_document ::= block_node DOCUMENT-END*
// explicit_document ::= DIRECTIVE* DOCUMENT-START block_node? DOCUMENT-END*
// block_node_or_indentless_sequence ::=
//                       ALIAS
//                       | properties (block_content | indentless_block_sequence)?
//                       | block_content
//                       | indentless_block_sequence
// block_node        ::= ALIAS
//                       | properties block_content?
//                       | block_content
// flow_node         ::= ALIAS
//                       | properties flow_content?
//                       | flow_content
// properties        ::= TAG ANCHOR? | ANCHOR TAG?
// block_content     ::= block_collection | flow_collection | SCALAR
// flow_content      ::= flow_collection | SCALAR
// block_collection  ::= block_sequence | block_mapping
// flow_collection   ::= flow_sequence | flow_mapping
// block_sequence    ::= BLOCK-SEQUENCE-START (BLOCK-ENTRY block_node?)* BLOCK-END
// indentless_sequence   ::= (BLOCK-ENTRY block_node?)+
// block_mapping     ::= BLOCK-MAPPING_START
//                       ((KEY block_node_or_indentless_sequence?)?
//                       (VALUE block_node_or_indentless_sequence?)?)*
//                       BLOCK-END
// flow_sequence     ::= FLOW-SEQUENCE-START
//                       (flow_sequence_entry FLOW-ENTRY)*
//                       flow_sequence_entry?
//                       FLOW-SEQUENCE-END
// flow_sequence_entry   ::= flow_node | KEY flow_node? (VALUE flow_node?)?
// flow_mapping      ::= FLOW-MAPPING-START
//                       (flow_mapping_entry FLOW-ENTRY)*
//                       flow_mapping_entry?
//                       FLOW-MAPPING-END
// flow_mapping_entry    ::= flow_node | KEY flow_node? (VALUE flow_node?)?
//
// FIRST sets:
//
// stream: { STREAM-START }
// explicit_document: { DIRECTIVE DOCUMENT-START }
// implicit_document: FIRST(block_node)
// block_node: { ALIAS TAG ANCHOR SCALAR BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START }
// flow_node: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START }
// block_content: { BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START SCALAR }
// flow_content: { FLOW-SEQUENCE-START FLOW-MAPPING-START SCALAR }
// block_collection: { BLOCK-SEQUENCE-START BLOCK-MAPPING-START }
// flow_collection: { FLOW-SEQUENCE-START FLOW-MAPPING-START }
// block_sequence: { BLOCK-SEQUENCE-START }
// block_mapping: { BLOCK-MAPPING-START }
// block_node_or_indentless_sequence: { ALIAS ANCHOR TAG SCALAR BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START BLOCK-ENTRY }
// indentless_sequence: { ENTRY }
// flow_collection: { FLOW-SEQUENCE-START FLOW-MAPPING-START }
// flow_sequence: { FLOW-SEQUENCE-START }
// flow_mapping: { FLOW-MAPPING-START }
// flow_sequence_entry: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START KEY }
// flow_mapping_entry: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START KEY }

JS.require('JS.Class');


var __ = require('./import')('error', 'tokens', 'events', 'scanner');


var ParserError = exports.ParserError = new JS.Class('ParserError', __.MarkedYAMLError, {});


var DEFAULT_TAGS = {
  '!':  '!',
  '!!': 'tag:yaml.org,2002:'
};


exports.Parser = new JS.Class('Parser', {
  initialize: function () {
    this.currentEvent = null;
    this.yamlVersion = null;
    this.tagHandles = {};
    this.states = [];
    this.marks = [];
    this.state = this.method('parseStreamStart');
  },

  dispose: function () {
    // Reset the state attributes (to clear self-references)
    this.states = [];
    this.state = null;
  },

  checkEvent: function () {
    var i;

    // Check the type of the next event.
    if (null === this.currentEvent && !!this.state) {
      this.currentEvent = this.state();
    }

    if (null !== this.currentEvent) {
      if (0 === arguments.length) {
        return true;
      }

      for (i = 0; i < arguments.length; i++) {
        if (arguments[i] instanceof this.currentEvent) {
          return true;
        }
      }
    }

    return false;
  },

  peekEvent: function () {
    // Get the next event.
    if (null === this.currentEvent && !!this.state) {
      this.currentEvent = this.state();
    }

    return this.currentEvent;
  },

  getEvent: function () {
    var value;

    // Get the next event and proceed further.
    if (null === this.currentEvent && !!this.state) {
      this.currentEvent = this.state();
    }

    value = this.currentEvent;
    this.currentEvent = null;

    return value;
  },

  parseStreamStart: function () {
    var token, event;

    // Parse the stream start.
    token = this.getToken();
    event = new __.StreamStartEvent(token.startMark, token.endMark,
                                    token.encoding);

    // Prepare the next state.
    this.state = this.method('parseImplicitDocumentStart');

    return event;
  },

  parseImplicitDocumentStart: function () {
    var token, event;
    if (this.checkToken(__.DirectiveToken, __.DocumentStartToken, __.StreamEndToken)) {
      return this.parseDocumentStart();
    }

    // Parse an implicit document.
    this.tagHandles = this.DEFAULT_TAGS;
    token = this.peekToken();
    event = new __.DocumentStartEvent(token.startMark, token.startMark, false);

    // Prepare the next state.
    this.states.append(this.method('parseDocumentEnd'));
    this.state = this.method('parseBlockNode');

    return event;
  },

  parseDocumentStart: function () {
    var token, event, version, tags, startMark;

    // Parse any extra document end indicators.
    while (this.checkToken(__.DocumentEndToken)) {
        this.getToken();
    }

    if (this.checkToken(__.StreamEndToken)) {
      // Parse the end of the stream.
      token = this.getToken();
      event = new __.StreamEndEvent(token.startMark, token.endMark)

      // Should be empty arrays
      assert.ok(!this.states && !this.states.length);
      assert.ok(!this.marks && !this.marks.length);

      this.state = null;
      return event;
    }

    // Parse an explicit document.
    token = this.peekToken();
    startMark = token.startMark;

    (function (v, t) { version = v; tags = t; }).apply(this, this.processDirectives());

    if (!this.checkToken(__.DocumentStartToken)) {
      throw new ParserError(null, null,
                  "expected '<document start>', but found " + this.peekToken().id,
                  this.peekToken().startMark);
    }

    token = this.getToken();
    event = new __.DocumentStartEvent(startMark, token.endMark, true, version, tags);

    this.states.append(this.method('parseDocumentEnd'));
    this.state = this.method('parseDocumentContent');

    return event;
  },

  parseDocumentEnd: function () {
    var token, event, explicit, startMark, endMark;

    // Parse the document end.
    token = this.peekToken();
    startMark = endMark = token.startMark;
    explicit = false;

    if (this.checkToken(__.DocumentEndToken)) {
        token = this.getToken();
        endMark = token.endMark;
        explicit = true;
    }

    event = new __.DocumentEndEvent(startMark, endMark, explicit);

    // Prepare the next state.
    this.state = this.method('parseDocumentStart');

    return event;
  },

  parseDocumentContent: function () {
    var event;

    if (!this.checkToken(__.DirectiveToken, __.DocumentStartToken,
                         __.DocumentEndToken, __.StreamEndToken)) {
      return this.parseBlockNode();
    }

    event = this.processEmptyScalar(this.peekToken().startMark);
    this.state = this.states.pop();

    return event;
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
