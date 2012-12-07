'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _nodes  = require('../../lib/js-yaml/nodes');

var _common = require('../support/common');
var _functional = require('../support/functional');


_functional.generateTests({
  description: "Test implicit resolver.",
  files: ['.data', '.detect'],
  test: function (dataFile, detectFile) {
    var node, correctTag;
    
    node = jsyaml.compose(dataFile.content);
    correctTag = detectFile.content.replace(/^[ \s]+|[ \s]+$/g, '');

    assert(_common.isInstanceOf(node, _nodes.SequenceNode));

    _common.each(node.value, function (scalar) {
      assert(_common.isInstanceOf(scalar, _nodes.ScalarNode));
      assert.equal(scalar.tag, correctTag);
    });
  }
});
