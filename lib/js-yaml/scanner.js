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
JS.require('JS.LinkedList.Doubly');


var assert = require('assert'),
    __ = require('./import')('error', 'tokens');


var ESCAPE_REPLACEMENTS = new JS.Hash([
  '0',    '\0',
  'a',    '\x07',
  'b',    '\x08',
  't',    '\x09',
  '\t',   '\x09',
  'n',    '\x0A',
  'v',    '\x0B',
  'f',    '\x0C',
  'r',    '\x0D',
  'e',    '\x1B',
  ' ',    '\x20',
  '\"',   '\"',
  '\\',   '\\',
  'N',    '\x85',
  '_',    '\xA0',
  'L',    '\u2028',
  'P',    '\u2029'
]);

var ESCAPE_CODES = new JS.Hash([
  'x',    2,
  'u',    4,
  'U',    8
]);

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
    this.tokens = new JS.LinkedList.Doubly();

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
      tokenNumber = this.tokensTaken + this.tokens.length;
      key = new SimpleKey(tokenNumber, required, this.index, this.line,
                          this.column, this.getMark());
      this.possibleSimpleKeys.store(this.flowLevel,  key);
    }
  },

  removePossibleSimpleKey: function() {
    var key;

    // Remove the saved possible key position at the current flow level.

    if (this.possibleSimpleKeys.hasKey(this.flowLevel)) {
      key = this.possibleSimpleKeys.get(this.flowLevel);

      if (key.required) {
         throw new ScannerError("while scanning a simple key", key.mark,
                                "could not found expected ':'", this.getMark());
      }

      this.possibleSimpleKeys.remove(this.flowLevel);
    };
  },

  unwindIndent: function (column) {
    var mark;

    // In flow context, tokens should respect indentation.
    // Actually the condition should be `self.indent >= column` according to
    // the spec. But this condition will prohibit intuitively correct
    // constructions such as
    //   key : {
    //   }
    //  if self.flow_level and self.indent > column:
    //    raise ScannerError(None, None,
    //            "invalid intendation or unclosed '[' or '{'",
    //            self.get_mark())

    // In the flow context, indentation is ignored. We make the scanner less
    // restrictive then specification requires.

    if (this.flowLevel) {
      return;
    }

    // In block context, we may need to issue the BLOCK-END tokens.
    while (this.indent > column) {
      mark = this.getMark();
      this.indent = this.indents.pop();
      this.tokens.push(new __.BlockEndToken(mark, mark));
    }
  },

  addIndent: function (column) {
    // Check if we need to increase indentation.

    if (this.indent < column) {
      this.indents.append(this.indent);
      this.indent = column;
      return true;
    }

    return false;
  },

  fetchStreamStart: function () {
    var mark;

    // We always add STREAM-START as the first token and STREAM-END as the
    // last token.

    // Read the token.
    mark = this.getMark();
    
    // Add STREAM-START.
    this.tokens.push(new __.StreamStartToken(mark, mark, this.encoding));
  },

  fetchStreamEnd: function () {
    var mark;

    // Set the current intendation to -1.
    this.unwindIndent(-1);

    // Reset simple keys.
    this.removePossibleSimpleKey();
    this.allowSimpleKey = false;
    this.possibleSimpleKeys = {};

    // Read the token.
    mark = this.getMark();
    
    // Add STREAM-END.
    this.tokens.push(new __.StreamEndToken(mark, mark));

    // The steam is finished.
    this.done = true;
  },

  fetchDirective: function () {
    // Set the current intendation to -1.
    this.unwindIndent(-1);

    // Reset simple keys.
    this.removePossibleSimpleKey();
    this.allowSimpleKey = false;

    // Scan and add DIRECTIVE.
    this.tokens.push(this.scanDirective());
  },

  fetchDocumentStart: function () {
    this.fetchDocumentIndicator(__.DocumentStartToken);
  },

  fetchDocumentEnd: function () {
    this.fetchDocumentIndicator(__.DocumentEndToken);
  },

  fetchDocumentIndicator: function (TokenClass) {
    var startMark, endMark;

    // Set the current intendation to -1.
    this.unwindIndent(-1);

    // Reset simple keys. Note that there could not be a block collection
    // after '---'.
    this.removePossibleSimpleKey();
    this.allowSimpleKey = false;

    // Add DOCUMENT-START or DOCUMENT-END.
    startMark = this.getMark();
    this.forward(3);
    endMark = this.getMark();

    this.tokens.push(new TokenClass(startMark, endMark));
  },

  fetchFlowSequenceStart: function () {
    this.fetchFlowCollectionStart(__.FlowSequenceStartToken);
  },

  fetchFlowMappingStart: function () {
    this.fetchFlowCollectionStart(__.FlowMappingStartToken);
  },

  fetchFlowCollectionStart: function (TokenClass) {
    var startMark, endMark;

    // '[' and '{' may start a simple key.
    this.savePossibleSimpleKey();

    // Increase the flow level.
    this.flowLevel++;

    // Simple keys are allowed after '[' and '{'.
    this.allowSimpleKey = true;

    // Add FLOW-SEQUENCE-START or FLOW-MAPPING-START.
    startMark = this.getMark();
    this.forward();
    endMark = this.getMark();

    this.tokens.push(new TokenClass(startMark, endMark));
  },

  fetchFlowSequenceEnd: function () {
    this.fetchFlowCollectionEnd(__.FlowSequenceEndToken);
  },

  fetchFlowMappingEnd: function () {
    this.fetchFlowCollectionEnd(__.FlowMappingEndToken);
  },

  fetchFlowCollectionEnd: function (TokenClass) {
    var startMark, endMark;

    // Reset possible simple key on the current level.
    this.removePossibleSimpleKey();

    // Decrease the flow level.
    this.flowLevel--;

    // No simple keys after ']' or '}'.
    this.allowSimpleKey = false;

    // Add FLOW-SEQUENCE-END or FLOW-MAPPING-END.
    startMark = this.getMark();
    this.forward();
    endMark = this.getMark();
    this.tokens.push(new TokenClass(startMark, endMark));
  },

  fetchFlowEntry: function () {
    var startMark, endMark;

    // Simple keys are allowed after ','.
    this.allowSimpleKey = true;

    // Reset possible simple key on the current level.
    this.removePossibleSimpleKey();

    // Add FLOW-ENTRY.
    startMark = this.getMark();
    this.forward();
    endMark = this.getMark();

    this.tokens.push(new __.FlowEntryToken(startMark, endMark));
  },

  fetchBlockEntry: function () {
    var mark, startMark, endMark;

    // Block context needs additional checks.
    if (!this.flowLevel) {
      // Are we allowed to start a new entry?
      if (!this.allowSimpleKey) {
        throw new ScannerError(null, null,
                               "sequence entries are not allowed here",
                               this.getMark());
      }

      // We may need to add BLOCK-SEQUENCE-START.
      if (this.addIndent(this.column)) {
        mark = this.getMark();
        this.tokens.push(new __.BlockSequenceStartToken(mark, mark));
      }
    } else {
      // It's an error for the block entry to occur in the flow context,
      // but we let the parser detect this.
    }

    // Simple keys are allowed after '-'.
    this.allowSimpleKey = true;

    // Reset possible simple key on the current level.
    this.removePossibleSimpleKey();

    // Add BLOCK-ENTRY.
    startMark = this.getMark();
    this.forward();
    endMark = this.getMark();

    this.tokens.push(new __.BlockEntryToken(startMark, endMark));
  },

  fetchKey: function () {
    var mark, startMark, endMark;

    // Block context needs additional checks.
    if (!this.flowLevel) {
      // Are we allowed to start a key (not nessesary a simple)?
      if (!this.allowSimpleKey) {
        throw new ScannerError(null, null,
                               "mapping keys are not allowed here",
                               this.getMark());
      }

      // We may need to add BLOCK-MAPPING-START.
      if (this.addIndent(this.column)) {
        mark = this.getMark();
        this.tokens.push(new __.BlockMappingStartToken(mark, mark));
      }
    }

    // Simple keys are allowed after '?' in the block context.
    this.allowSimpleKey = !this.flowLevel;

    // Reset possible simple key on the current level.
    this.removePossibleSimpleKey();

    // Add KEY.
    startMark = this.getMark();
    this.forward();
    endMark = this.getMark();

    this.tokens.push(new __.KeyToken(startMark, endMark));
  },

  fetchValue: function () {
    var key, mark, startMark, endMark;

    // Do we determine a simple key?
    if (this.possibleSimpleKeys.hasKey(this.flowLevel)) {
        // Add KEY.
        key = this.possibleSimpleKeys.remove(this.flowLevel);
        this.tokens.insertAt(key.tokenNumber - this.tokensTaken,
                             new __.KeyToken(key.mark, key.mark));

        // If this key starts a new block mapping, we need to add
        // BLOCK-MAPPING-START.
        if (!this.flowLevel) {
          if (this.addIndent(key.column)) {
            this.tokens.insertAt(key.tokenNumber - this.tokensTaken,
                                 new __.BlockMappingStartToken(key.mark, key.mark));
          }
        }

        // There cannot be two simple keys one after another.
        this.allowSimpleKey = false;

    // It must be a part of a complex key.
    } else {
        // Block context needs additional checks.
        // (Do we really need them? They will be catched by the parser
        // anyway.)
        if (!this.flowLevel) {
          // We are allowed to start a complex value if and only if
          // we can start a simple key.
          if (!this.allowSimpleKey) {
            throw new ScannerError(null, null,
                                   "mapping values are not allowed here",
                                   this.getMark());
          }
        }

        // If this value starts a new block mapping, we need to add
        // BLOCK-MAPPING-START.  It will be detected as an error later by
        // the parser.
        if (!this.flowLevel) {
          if (this.addIndent(this.column)) {
            mark = this.getMark();
            this.tokens.append(new __.BlockMappingStartToken(mark, mark));
          }
        }

        // Simple keys are allowed after ':' in the block context.
        this.allowSimpleKey = !this.flowLevel;

        // Reset possible simple key on the current level.
        this.removePossibleSimpleKey();
    }

    // Add VALUE.
    startMark = this.getMark();
    this.forward()l
    endMark = this.getMark();

    this.tokens.push(new __.ValueToken(startMark, endMark));
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
