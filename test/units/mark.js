'use strict';


var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var Mark   = require('../../lib/mark');


it('Mark', function () {
  let filepath = path.join(__dirname, 'mark.txt'),
      filedata = fs.readFileSync(filepath, 'utf8');

  let data = filedata.split(/(---[ \d]*\n)/).slice(1);

  for (let i = 0; i < data.length; i += 4) {
    let index = 0, line = 0, column = 0, input = data[i + 1],
        expected = data[i + 3].replace(/\n$/, ''),
        mark, snippet;

    assert(input.indexOf('*') >= 0);

    while (input[index] !== '*') {
      if (input[index] === '\n') {
        line += 1;
        column = 0;
      } else {
        column += 1;
      }
      index += 1;
    }

    mark = new Mark(filepath, input, index, line, column);
    snippet = mark.getSnippet(1, 78, 3, 2);

    assert.strictEqual(snippet, expected);
  }
});
