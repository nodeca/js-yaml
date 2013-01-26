'use strict';


var assert = require('assert');
var Mark   = require('../../lib/js-yaml/mark');

var _functional = require('../support/functional');


_functional.generateTests({
  description: 'Test marks.',
  files: ['.marks'],
  test: function (marksFile) {
    marksFile.content.split('---\n').slice(1).forEach(function (input) {
      var index = 0, line = 0, column = 0,
          mark, snippet, data, pointer, temp;

      assert(0 <= input.indexOf('*'));

      while (input[index] !== '*') {
        if (input[index] === '\n') {
          line += 1;
          column = 0;
        } else {
          column += 1;
        }
        index += 1;
      }

      mark = new Mark(marksFile.path, input, index, line, column);
      snippet = mark.getSnippet(2, 79);

      assert(typeof snippet, 'string');
      
      temp = snippet.split('\n');
      assert.strictEqual(temp.length, 2);

      data = temp[0];
      pointer = temp[1];

      assert(data.length < 82);
      assert.strictEqual(data[pointer.length - 1], '*');
    });
  }
});
