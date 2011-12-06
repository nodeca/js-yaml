var test = module.exports = {},
    fs = require('fs'),
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    helper = require(__dirname + '/../test-helper'),
    $$ = require(__dirname + '/../../lib/js-yaml/common'),
    _tokens = require(__dirname + '/../../lib/js-yaml/tokens');

// Tokens mnemonic:
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

var REPLACES = new $$.Hash();

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


test.unittest = ['.data', '.tokens'];
test.execute = function test_tokens(data_filename, tokens_filename) {
  var tokens1 = [], tokens2 = [];
  
  fs.readFileSync(tokens_filename, 'utf8').split(/[ \n]/).forEach(function (t) {
    if (!!t) { tokens2.push(t); }
  });

  jsyaml.scan(fs.readFileSync(data_filename, 'utf8'), function (token) {
    if ($$.isInstanceOf(token, _tokens.StreamStartToken) || $$.isInstanceOf(token, _tokens.StreamEndToken)) {
      return;
    }

    tokens1.push(REPLACES.get(token.constructor));
  });

  assert.equal(tokens1.length, tokens2.length);

  tokens1.forEach(function (token1, i) {
    assert.equal(token1, tokens2[i]);
  });
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
