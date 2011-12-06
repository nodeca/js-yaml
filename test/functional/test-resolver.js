var suite = module.exports = [],
    fs = require('fs'),
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    helper = require(__dirname + '/../test-helper'),
    $$ = require(__dirname + '/../../lib/js-yaml/common'),
    _nodes = require(__dirname + '/../../lib/js-yaml/nodes');


suite.push({
  unittest: ['.data', '.detect'],
  execute: function test_implicit_resolver(data_filename, detect_filename) {
    var correctTag = fs.readFileSync(detect_filename, 'utf8').replace(/^[ \s]+|[ \s]+$/g, ''),
        node = jsyaml.compose(fs.readFileSync(data_filename, 'utf8'));

    assert.equal($$.isInstanceOf(node, _nodes.SequenceNode), true);

    $$.each(node.value, function (scalar) {
      assert.equal($$.isInstanceOf(scalar, _nodes.ScalarNode), true);
      assert.equal(scalar.tag, correctTag);
    });
  }
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
