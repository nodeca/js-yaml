'use strict';


var assert = require('assert');
var _reader = require('../../lib/js-yaml/reader');

var _functional = require('../support/functional');


_functional.generateTests({
  description: 'Test reader.',
  files: ['.stream-error'],
  handler: function (errorFile) {
    assert.throws(function () {
      var stream = new _reader.Reader(errorFile.data);

      while (stream.peek() != '\0') {
        stream.forward();
      }
    }, _reader.ReaderError);
  }
});
