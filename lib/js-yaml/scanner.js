// Scanner produces tokens of the following types:
//
// STREAM-START
// STREAM-END
// DIRECTIVE(name, value)
// DOCUMENT-START
// DOCUMENT-END
// BLOCK-SEQUENCE-START
// BLOCK-MAPPING-START
// BLOCK-END
// FLOW-SEQUENCE-START
// FLOW-MAPPING-START
// FLOW-SEQUENCE-END
// FLOW-MAPPING-END
// BLOCK-ENTRY
// FLOW-ENTRY
// KEY
// VALUE
// ALIAS(value)
// ANCHOR(value)
// TAG(value)
// SCALAR(value, plain, style)
// 
// Read comments in the Scanner code for more details.


JS.require('JS.Class');
JS.require('JS.Hash');


var assert = require('assert'),
    __ = require('./import')('error', 'tokens');


var ScannerError = exports.ScannerError = new JS.Class('ScannerError', __.MarkedYAMLError, {});


var SimpleKey = new JS.Class('SimpleKey', {
  // See below simple keys treatment.

  initialize: function (tokenNumber, required, index, line, column, mark) {
    this.tokenNumber = tokenNumber;
    this.required = required;
    this.index = index;
    this.line = line;
    this.column = column;
    this.mark = mark;
  }
});


exports.Scanner = new JS.Class('Scanner', {
  initialize: function () {
    // It is assumed that Scanner and Reader will have a common descendant.
    // Reader do the dirty work of checking for BOM and converting the
    // input data to Unicode. It also adds NUL to the end.
    //
    // Reader supports the following methods
    //   this.peek(i=0)       # peek the next i-th character
    //   this.prefix(l=1)     # peek the next l characters
    //   this.forward(l=1)    # read the next l characters and move the pointer.

    // Had we reached the end of the stream?
    this.done = false;

    // The number of unclosed '{' and '['. `flowLevel == 0` means block
    // context.
    this.flowLevel = 0;

    // List of processed tokens that are not yet emitted.
    this.tokens = [];

    // Add the STREAM-START token.
    this.fetchStreamStart();

    // Number of tokens that were emitted through the `getToken` method.
    this.tokensTaken = 0;

    // The current indentation level.
    this.indent = -1;

    // Past indentation levels.
    this.indents = [];

    // Variables related to simple keys treatment.

    // A simple key is a key that is not denoted by the '?' indicator.
    // Example of simple keys:
    //   ---
    //   block simple key: value
    //   ? not a simple key:
    //   : { flow simple key: value }
    // We emit the KEY token before all keys, so when we find a potential
    // simple key, we try to locate the corresponding ':' indicator.
    // Simple keys should be limited to a single line and 1024 characters.

    // Can a simple key start at the current position? A simple key may
    // start:
    // - at the beginning of the line, not counting indentation spaces
    //       (in block context),
    // - after '{', '[', ',' (in the flow context),
    // - after '?', ':', '-' (in the block context).
    // In the block context, this flag also signifies if a block collection
    // may start at the current position.
    this.allowSimpleKey = true;

    // Keep track of possible simple keys. This is a dictionary. The key
    // is `flowLevel`; there can be no more that one possible simple key
    // for each level. The value is a SimpleKey record:
    //   (tokenNumber, required, index, line, column, mark)
    // A simple key may start with ALIAS, ANCHOR, TAG, SCALAR(flow),
    // '[', or '{' tokens.
    this.possibleSimpleKeys = new JS.Hash();
  },

  checkToken: function () {
    var i;

    while (this.needMoreTokens()) {
      this.fetchMoreTokens();
    }

    if (this.tokens.length) {
      if (arguments.length) {
        return true;
      }

      for (i = 0; i < arguments.length; i++) {
        if (this.tokens[0].isA(arguments[i])) {
          return true;
        }
      }
    }

    return false;
  },

  peekToken: function () {
    // Return the next token, but do not delete if from the queue.

    while (this.needMoreTokens()) {
      this.fetchMoreTokens();
    }

    if (this.tokens.length) {
      return this.tokens[0];
    }
  },

  getToken: function () {
    // Return the next token.

    while (this.needMoreTokens()) {
      this.fetchMoreTokens();
    }

    if (this.tokens.length) {
      this.tokensTaken += 1;
      return this.tokens.shift();
    }
  },

  needMoreTokens: function () {
    if (this.done) {
      return false;
    }

    if (!this.tokens.length) {
      return true;
    }

    // The current token may be a potential simple key, so we
    // need to look further.

    this.stalePossibleSimpleKeys();
    if (this.nextPossibleSimpleKey() == this.tokensTaken) {
      return true;
    }
  },

  fetchMoreTokens: function () {
    var ch;

    // Eat whitespaces and comments until we reach the next token.
    this.scanToNextToken();

    // Remove obsolete possible simple keys.
    this.stalePossibleSimpleKeys();

    // Compare the current indentation and column. It may add some tokens
    // and decrease the current indentation level.
    this.unwindIndent(this.column);

    // Peek the next character.
    ch = this.peek();

    // Is it the end of stream?
    if (ch == '\0') {
      return this.fetchStreamEnd();
    }

    // Is it a directive?
    if (ch == '%' && this.checkDirective()) {
      return this.fetchDirective();
    }

    // Is it the document start?
    if (ch == '-' && this.checkDocumentStart()) {
      return this.fetchDocumentStart();
    }

    // Is it the document end?
    if (ch == '.' && this.checkDocumentEnd()) {
      return this.fetchDocumentEnd();
    }

    // Note: the order of the following checks is NOT significant.

    // Is it the flow sequence start indicator?
    if (ch == '[') {
      return this.fetchFlowSequenceStart();
    }

    // Is it the flow mapping start indicator?
    if (ch == '{') {
      return this.fetchFlowMappingStart();
    }

    // Is it the flow sequence end indicator?
    if (ch == ']') {
      return this.fetchFlowSequenceEnd();
    }

    // Is it the flow mapping end indicator?
    if (ch == '}') {
      return this.fetchFlowMappingEnd();
    }

    // Is it the flow entry indicator?
    if (ch == ',') {
      return this.fetchFlowEntry();
    }

    // Is it the block entry indicator?
    if (ch == '-' && this.checkBlockEntry()) {
      return this.fetchBlockEntry();
    }

    // Is it the key indicator?
    if (ch == '?' && this.checkKey()) {
      return this.fetchKey();
    }

    // Is it the value indicator?
    if (ch == ':' && this.checkValue()) {
      return this.fetchValue();
    }

    // Is it an alias?
    if (ch == '*') {
      return this.fetchAlias();
    }

    // Is it an anchor?
    if (ch == '&') {
      return this.fetchAnchor();
    }

    // Is it a tag?
    if (ch == '!') {
      return this.fetchTag();
    }

    // Is it a literal scalar?
    if (ch == '|' && !this.flowLevel) {
      return this.fetchLiteral();
    }

    // Is it a folded scalar?
    if (ch == '>' && !this.flowLevel) {
      return this.fetchFolded();
    }

    // Is it a single quoted scalar?
    if (ch == '\'') {
      return this.fetchSingle();
    }

    // Is it a double quoted scalar?
    if (ch == '\"') {
      return this.fetchDouble();
    }

    // It must be a plain scalar then.
    if (this.checkPlain()) {
      return this.fetchPlain();
    }

    // No? It's an error. Let's produce a nice error message.
    throw new ScannerError("while scanning for the next token", null,
                           "found character " + ch + " that cannot start any token",
                           this.getMark());
  },

  nextPossibleSimpleKey: function () {
    var minTokenNumber = null;

    // Return the number of the nearest possible simple key. Actually we
    // don't need to loop through the whole dictionary. We may replace it
    // with the following code:
    //   if (!this.possibleSimpleKeys.langth) {
    //     return null;
    //   }
    //   return this.possibleSimpleKeys[
    //     Math.min.apply({}, this.possibleSimpleKeys.keys())
    //   ].tokenNumber;

    this.possibleSimpleKeys.forEachValue(function (key) {
      if (null === minTokenNumber || key.tokenNumber < minTokenNumber) {
        minTokenNumber = key.tokenNumber;
      }
    });

    return minTokenNumber;
  },

  stalePossibleSimpleKeys: function () {
    // Remove entries that are no longer possible simple keys. According to
    // the YAML specification, simple keys
    // - should be limited to a single line,
    // - should be no longer than 1024 characters.
    // Disabling this procedure will allow simple keys of any length and
    // height (may cause problems if indentation is broken though).
    this.possibleSimpleKeys.forEachPair(function (level, key) {
      if (key.line != this.line || 1024 < (this.index - key.index)) {
        if (key.required) {
          throw new ScannerError("while scanning a simple key", key.mark,
                                 "could not found expected ':'", this.getMark());
        }
        this.possibleSimpleKeys.remove(level);
      }
    }, this);
  },

  savePossibleSimpleKey: function () {
    var required, tokenNumber, key;

    // The next token may start a simple key. We check if it's possible
    // and save its position. This function is called for
    //   ALIAS, ANCHOR, TAG, SCALAR(flow), '[', and '{'.

    // Check if a simple key is required at the current position.
    required = !(this.flowLevel && this.indent == this.column);

    // A simple key is required only if it is the first token in the current
    // line. Therefore it is always allowed.
    assert.ok(this.allowSimpleKey || !required);

    // The next token might be a simple key. Let's save it's number and
    // position.
    if (this.allowSimpleKey) {
      this.removePossibleSimpleKey();
      token_number = this.tokensTaken + this.tokens.length;
      key = new SimpleKey(tokenNumber, required, this.index, this.line,
                          this.column, this.getMark());
      this.possibleSimpleKeys.store(this.flow_level,  key);
    }
  },
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
