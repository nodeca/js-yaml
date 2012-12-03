'use strict';


var assert = require('assert');
var util = require('util');
var $$$ = require('../../lib/js-yaml-test/common');
var functional = require('../../lib/js-yaml-test/functional');
var TestLoader = require('../../lib/js-yaml-test/test-loader');
var _classes = require('../../lib/js-yaml-test/classes');
var jsyaml = require('../../lib/js-yaml');


functional.generateTests({
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

    assert($$$.areEqual(object1, object2),
      util.format('Expected\n\n%s\n\n  to be equal to\n\n%s\n',
        util.inspect(object1),
        util.inspect(object2)));
  }
});
