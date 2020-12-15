'use strict';


var common = require('./common');


function Mark(name, buffer, position, line, column) {
  this.name     = name;
  this.buffer   = buffer;
  this.position = position;
  this.line     = line;
  this.column   = column;
}


Mark.prototype.getSnippet = function getSnippet(indent, maxLength, linesBefore, linesAfter) {
  if (!this.buffer) return null;

  var buffer = this.buffer;

  if (!maxLength) maxLength = 79;
  if (typeof indent      !== 'number') indent      = 1;
  if (typeof linesBefore !== 'number') linesBefore = 3;
  if (typeof linesAfter  !== 'number') linesAfter  = 2;

  // get snippet for a single line, respecting maxLength
  function getLine(lineStart, lineEnd, position, maxLineLength) {
    var head = '';
    var tail = '';
    var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

    if (position - lineStart > maxHalfLength) {
      head = ' ... ';
      lineStart = position - maxHalfLength + head.length;
    }

    if (lineEnd - position > maxHalfLength) {
      tail = ' ...';
      lineEnd = position + maxHalfLength - tail.length;
    }

    return {
      str: head + buffer.slice(lineStart, lineEnd) + tail,
      pos: position - lineStart + head.length // relative position
    };
  }

  function padStart(string, max) {
    return common.repeat(' ', max - string.length) + string;
  }

  var re = /\r?\n|\r|\0/g;
  var lineStarts = [ 0 ];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;

  while ((match = re.exec(buffer))) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);

    if (this.position < match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }

  var result = '', i, line;
  var lineNoLength = Math.min(this.line + linesAfter, lineEnds.length).toString().length;
  var maxLineLength = maxLength - (indent + lineNoLength + 3);

  for (i = 1; i <= linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      this.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common.repeat(' ', indent) + padStart((this.line - i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n' + result;
  }

  line = getLine(lineStarts[foundLineNo], lineEnds[foundLineNo], this.position, maxLineLength);
  result += common.repeat(' ', indent) + padStart((this.line + 1).toString(), lineNoLength) +
    ' | ' + line.str + '\n';
  result += common.repeat('-', indent + lineNoLength + 3 + line.pos) + '^' + '\n';

  for (i = 1; i <= linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      this.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common.repeat(' ', indent) + padStart((this.line + i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n';
  }

  return result.replace(/\n$/, '');
};


Mark.prototype.toString = function toString(compact) {
  var snippet, where = '';

  if (this.name) {
    where += 'in "' + this.name + '" ';
  }

  where += '(' + (this.line + 1) + ':' + (this.column + 1) + ')';

  if (!compact) {
    snippet = this.getSnippet();

    if (snippet) {
      where += '\n\n' + snippet;
    }
  }

  return where;
};


module.exports = Mark;
