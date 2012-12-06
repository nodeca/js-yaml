'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _tokens = require('../../lib/js-yaml/tokens');

var _common = require('../support/common');
var _functional = require('../support/functional');

// _tokens mnemonic:
// directive:            %
// document_start:       ---
// document_end:         ...
// alias:                *
// anchor:               &
// tag:                  !
// scalar                _
// block_sequence_start: [[
// block_mapping_start:  {{
// block_end:            ]}
// flow_sequence_start:  [
// flow_sequence_end:    ]
// flow_mapping_start:   {
// flow_mapping_end:     }
// entry:                ,
// key:                  ?
// value:                :

var REPLACES = new _common.Hash();

REPLACES.store(_tokens.DirectiveToken,           '%');
REPLACES.store(_tokens.DocumentStartToken,       '---');
REPLACES.store(_tokens.DocumentEndToken,         '...');
REPLACES.store(_tokens.AliasToken,               '*');
REPLACES.store(_tokens.AnchorToken,              '&');
REPLACES.store(_tokens.TagToken,                 '!');
REPLACES.store(_tokens.ScalarToken,              '_');
REPLACES.store(_tokens.BlockSequenceStartToken,  '[[');
REPLACES.store(_tokens.BlockMappingStartToken,   '{{');
REPLACES.store(_tokens.BlockEndToken,            ']}');
REPLACES.store(_tokens.FlowSequenceStartToken,   '[');
REPLACES.store(_tokens.FlowSequenceEndToken,     ']');
REPLACES.store(_tokens.FlowMappingStartToken,    '{');
REPLACES.store(_tokens.FlowMappingEndToken,      '}');
REPLACES.store(_tokens.BlockEntryToken,          ',');
REPLACES.store(_tokens.FlowEntryToken,           ',');
REPLACES.store(_tokens.KeyToken,                 '?');
REPLACES.store(_tokens.ValueToken,               ':');


_functional.generateTests({
  description: 'Test tokens.',
  files: ['.data', '.tokens'],
  handler: function (dataFile, tokensFile) {
    var result = [], expected = [];
    
    tokensFile.data.split(/[ \n]/).forEach(function (t) {
      if (!!t) { expected.push(t); }
    });

    jsyaml.scan(dataFile.data, function (token) {
      if (_common.isInstanceOf(token, _tokens.StreamStartToken) ||
          _common.isInstanceOf(token, _tokens.StreamEndToken)) {
        return;
      }

      result.push(REPLACES.get(token.constructor));
    });

    assert.equal(result.length, expected.length);

    result.forEach(function (token, i) {
      assert.equal(expected[i], token);
    });
  }
});
