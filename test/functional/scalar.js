'use strict';


var path   = require('path');
var jsyaml = require('../../lib/js-yaml');
var helper = require('../support/helper');
var paranoidEqual = require('../support/assert-paranoid-equal').paranoidEqual;


helper.generateTests({
  description: 'Dumper: scalar styles.',
  directory: path.join(__dirname, 'scalar'),
  files: ['.data', '.js'],
  test: function (dataFile, codeFile) {
    var object, expected, serialized, deserialized;
    object       = codeFile.content;
    expected     = dataFile.content;
    serialized   = jsyaml.dump(codeFile.content);
    deserialized = jsyaml.load(serialized);
    paranoidEqual(expected, serialized);
    paranoidEqual(object, deserialized);
  }
});
