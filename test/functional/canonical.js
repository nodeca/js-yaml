'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _errors = require('../../lib/js-yaml/errors');
var _functional = require('../support/functional');
var CanonicalLoader = require('../support/canonical-loader');


_functional.generateTests({
  description: 'Test canonical scanner.',
  files: [ '.canonical' ],
  test: function (canonicalFile) {
    var tokens = [];
    
    jsyaml.scan(canonicalFile.content, function (currentToken) {
      tokens.push(currentToken);
    }, CanonicalLoader);

    assert(0 < tokens.length);
  }
});


_functional.generateTests({
  description: 'Test canonical parser.',
  files: [ '.canonical' ],
  test: function (canonicalFile) {
    var events = [];
    
    jsyaml.parse(canonicalFile.content, function (currentEvent) {
      events.push(currentEvent);
    }, CanonicalLoader);

    assert(0 < events.length);
  }
});


_functional.generateTests({
  description: 'Test canonical error.',
  files: [ '.data', '.canonical' ],
  skip: [ '.empty' ],
  test: function (dataFile) {
    assert.throws(function () {
      jsyaml.loadAll(dataFile.content, function () {}, CanonicalLoader);
    }, _errors.YAMLError);
  }
});
