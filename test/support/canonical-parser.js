'use strict';


var _tokens = require('../../lib/js-yaml/tokens');
var _events = require('../../lib/js-yaml/events');
var _common = require('./common');
var CanonicalError = require('./canonical-error');


function CanonicalParser() {
  this.events = [];
  this.parsed = false;
}

CanonicalParser.prototype.dispose = function dispose() {};

CanonicalParser.prototype.parseStream = function parseStream() {
  this.getToken(_tokens.StreamStartToken);
  this.events.push(new _events.StreamStartEvent());
  
  while (!this.checkToken(_tokens.StreamEndToken)) {
    if (this.checkToken(_tokens.DirectiveToken,
                        _tokens.DocumentStartToken)) {

      this.parseDocument();

    } else {

      throw new CanonicalError(
        'document is expected, got ' +
        this.tokens[0].hash());
      
    }
  }

  this.getToken(_tokens.StreamEndToken);
  this.events.push(new _events.StreamEndEvent());
};

CanonicalParser.prototype.parseDocument = function parseDocument() {
  if (this.checkToken(_tokens.DirectiveToken)) {
    this.getToken(_tokens.DirectiveToken);
  }

  this.getToken(_tokens.DocumentStartToken);
  this.events.push(new _events.DocumentStartEvent());
  this.parseNode();
  this.events.push(new _events.DocumentEndEvent());
};

CanonicalParser.prototype.parseNode = function parseNode() {
  var anchor = null,
      tag = null;

  if (this.checkToken(_tokens.AliasToken)) {

    this.events.push(new _events.AliasEvent(this.getTokenValue()));

  } else {
    
    if (this.checkToken(_tokens.AnchorToken)) {
      anchor = this.getTokenValue();
    }

    if (this.checkToken(_tokens.TagToken)) {
      tag = this.getTokenValue();
    }

    if (this.checkToken(_tokens.ScalarToken)) {

      this.events.push(
        new _events.ScalarEvent(
          anchor,
          tag,
          [ false, false ],
          this.getTokenValue()));

    } else if (this.checkToken(_tokens.FlowSequenceStartToken)) {

      this.events.push(new _events.SequenceStartEvent(anchor, tag, null));
      this.parseSequence();

    } else if (this.checkToken(_tokens.FlowMappingStartToken)) {

      this.events.push(new _events.MappingStartEvent(anchor, tag, null));
      this.parseMapping();

    } else {

      throw new CanonicalError(
        "SCALAR, '[', or '{' is expected, got " +
        this.tokens[0].hash());
      
    }
  }
};

CanonicalParser.prototype.parseMapEntry = function parseMapEntry() {
  this.getToken(_tokens.KeyToken);
  this.parseNode();
  this.getToken(_tokens.ValueToken);
  this.parseNode();
};

CanonicalParser.prototype.parseSequence = function parseSequence() {
  this.getToken(_tokens.FlowSequenceStartToken);

  if (!this.checkToken(_tokens.FlowSequenceEndToken)) {
    this.parseNode();

    while (!this.checkToken(_tokens.FlowSequenceEndToken)) {
      this.getToken(_tokens.FlowEntryToken);

      if (!this.checkToken(_tokens.FlowSequenceEndToken)) {
        this.parseNode();
      }
    }
  }

  this.getToken(_tokens.FlowSequenceToken);
  this.events.push(new _events.SequenceEndEvent());
};

CanonicalParser.prototype.parseMapping = function parseMapping() {
  this.getToken(_tokens.FlowMappingStartToken);

  if (!this.checkToken(_tokens.FlowMappingEndToken)) {
    this.parseMapEntry();

    while (!this.checkToken(_tokens.FlowMappingEndToken)) {
      this.getToken(_tokens.FlowEntryToken);

      if (!this.checkToken(_tokens.FlowMappingEndToken)) {
        this.parseMapEntry();
      }
    }
  }

  this.getToken(_tokens.FlowMappingToken);
  this.events.push(new _events.MappingEndEvent());
};

CanonicalParser.prototype.parse = function parse() {
  this.parseStream();
  this.parsed = true;
};

CanonicalParser.prototype.peekEvent = function peekEvent() {
  if (!this.parsed) {
    this.parse();
  }

  return this.events[0];
};

CanonicalParser.prototype.getEvent = function getEvent() {
  if (!this.parsed) {
    this.parse();
  }

  return this.events.shift();
};

CanonicalParser.prototype.checkEvent = function checkEvent(/* choices... */) {
  var index;

  if (!this.parsed) {
    this.parse();
  }

  if (0 < this.events.length) {
    if (0 >= arguments.length) {
      return true;
    } else {
      for (index = 0; index < arguments.length; index += 1) {
        if (_common.isInstanceOf(this.events[0], arguments[index])) {
          return true;
        }
      }
    }
  }

  return false;
};


module.exports = CanonicalParser;
