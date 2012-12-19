'use strict';


var paranoidEqual = require('assert-paranoid-equal').paranoidEqual;
var jsyaml = require('../../lib/js-yaml');
var _functional = require('../support/functional');
var TestLoader = require('../support/test-loader');


_functional.generateTests({
  description: 'Test constructor.',
  files: ['.data', '.js'],
  test: function (dataFile, codeFile) {
    var object1 = [],
        object2 = codeFile.content;

    jsyaml.loadAll(dataFile.content, function (doc) {
      object1.push(doc);
    }, TestLoader);

    if (object1.length === 1) {
      object1 = object1[0];
    }

    if ('function' === typeof object2) {
      object2.call(this, object1);
    } else {
      paranoidEqual(object1, object2);
    }
  }
});
