var test = module.exports = {},
    fs = require('fs'),
    assert = require('assert'),
    helper = require(__dirname + '/../test-helper'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    $$ = require(__dirname + '/../../lib/js-yaml/core'),
    __ = $$.import('tokens');

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

REPLACES.store(__.DirectiveToken,           '%');
REPLACES.store(__.DocumentStartToken,       '---');
REPLACES.store(__.DocumentEndToken,         '...');
REPLACES.store(__.AliasToken,               '*');
REPLACES.store(__.AnchorToken,              '&');
REPLACES.store(__.TagToken,                 '!');
REPLACES.store(__.ScalarToken,              '_');
REPLACES.store(__.BlockSequenceStartToken,  '[[');
REPLACES.store(__.BlockMappingStartToken,   '{{');
REPLACES.store(__.BlockEndToken,            ']}');
REPLACES.store(__.FlowSequenceStartToken,   '[');
REPLACES.store(__.FlowSequenceEndToken,     ']');
REPLACES.store(__.FlowMappingStartToken,    '{');
REPLACES.store(__.FlowMappingEndToken,      '}');
REPLACES.store(__.BlockEntryToken,          ',');
REPLACES.store(__.FlowEntryToken,           ',');
REPLACES.store(__.KeyToken,                 '?');
REPLACES.store(__.ValueToken,               ':');


var test_tokens = function test_tokens(data_filename, tokens_filename) {
  var tokens1 = [],
      tokens2 = [];
  
  fs.readFileSync(tokens_filename, 'utf8').split(/[ \n]/).forEach(function (t) {
    if (!!t) { tokens2.push(t); }
  });

  jsyaml.scan(fs.readFileSync(data_filename, 'utf8'), function (token) {
    if (token.isA(__.StreamStartToken) || token.isA(__.StreamEndToken)) {
      return;
    }

    tokens1.push(REPLACES.get(token.__klass__));
  });

  assert.equal(tokens1.length, tokens2.length);

  tokens1.forEach(function (token1, i) {
    assert.equal(token1, tokens2[i]);
  });
};


test.title = "Test tokens generation";
test.execute = function () {
  $$.each(helper.findTestFilenames(__dirname + '/data'), function (exts, base) {
    var files = [];

    $$.each(['.data', '.tokens'], function (ext) {
      if (0 <= exts.indexOf(ext)) {
        files.push(__dirname + '/data/' + base + ext);
      }
    });

    if (2 === files.length) {
      test_tokens.apply(this, files);
    }
  });
};

////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
