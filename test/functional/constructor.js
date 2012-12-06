'use strict';


var assert = require('assert');
var util = require('util');
var jsyaml = require('../../lib/js-yaml');

var _common = require('../support/common');
var _classes = require('../support/classes');
var _functional = require('../support/functional');
var TestLoader = require('../support/test-loader');


_functional.generateTests({
  description: 'Test constructor.',
  files: ['.data', '.code'],
  handler: function (dataFile, codeFile) {
    var object1 = [],
        object2 = eval('(' + codeFile.data + ')');

    jsyaml.loadAll(dataFile.data, function (doc) {
      object1.push(doc);
    }, TestLoader);

    if (object1.length === 1) {
      object1 = object1[0];
    }

    assert(_common.areEqual(object1, object2),
      util.format('Expected\n\n%s\n\n  to be equal to\n\n%s\n',
        util.inspect(object1),
        util.inspect(object2)));
  }
});
