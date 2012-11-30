'use strict';


var assert = require('chai').assert;
var functional = require('../helpers/functional');
var jsyaml = require('../../lib/js-yaml');
var $$ = require('../../lib/js-yaml/common');
var _nodes  = require('../../lib/js-yaml/nodes');


functional.generateTests({
  description: "Test implicit resolver.",
  files: ['.data', '.detect'],
  handler: function (dataFile, detectFile) {
    var node, correctTag;
    
    node = jsyaml.compose(dataFile.data);
    correctTag = detectFile.data.replace(/^[ \s]+|[ \s]+$/g, '');

    assert.isTrue($$.isInstanceOf(node, _nodes.SequenceNode));

    $$.each(node.value, function (scalar) {
      assert.isTrue($$.isInstanceOf(scalar, _nodes.ScalarNode));
      assert.equal(scalar.tag, correctTag);
    });
  }
});
