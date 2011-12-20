'use strict';


var $$ = require('./common');


var repeat = function repeat(str, n) {
  var result = '', i;
  for (i = 0; i < n; i += 1) {
    result += str;
  }
  return result;
};


function Mark(name, index, line, column, buffer, pointer) {
  this.name = name;
  this.index = index;
  this.line = line;
  this.column = column;
  this.buffer = buffer;
  this.pointer = pointer;
}

Mark.prototype.getSnippet = function (indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) {
    return null;
  }

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.pointer;

  while (start > 0 && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer[start - 1])) {
    start -= 1;
    if (this.pointer - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.pointer;

  while (end < this.buffer.length && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer[end])) {
    end += 1;
    if (end - this.pointer > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return repeat(' ', indent) + head + snippet + tail + '\n' +
    repeat(' ', indent + this.pointer - start + head.length) + '^';
};

Mark.prototype.toString = function (compact) {
  var snippet = this.getSnippet(), where;

  where = ' in "' + this.name +
    '", line ' + (this.line + 1) +
    ', column ' + (this.column + 1);

  if (snippet && !compact) {
    where += ':\n' + snippet;
  }

  return where;
};


function YAMLError(message) {
  $$.extend(this, Error.prototype.constructor.call(this, message));
  this.name = 'YAMLError';
}
$$.inherits(YAMLError, Error);


function MarkedYAMLError(context, contextMark, problem, problemMark, note) {
  YAMLError.call(this);
  this.name = 'MarkedYAMLError';

  this.context = context || null;
  this.contextMark = contextMark || null;
  this.problem = problem || null;
  this.problemMark = problemMark || null;
  this.note = note || null;

  this.toStringCompact = function toStringCompact() {
    var rv = "Error ";

    if (null !== this.problemMark) {
      rv += "on line " + (this.problemMark.line+1) + ", col " + (this.problemMark.column+1) + ": ";
    }

    if (null !== this.problem) {
      rv += this.problem;
    }

    if (null !== this.note) {
      rv += this.note;
    }

    return rv;
  };

  this.toStringFull = function toStringFull() {
    var lines = [];

    if (null !== this.context) {
      lines.push(this.context);
    }

    if (null !== this.contextMark
        && (null === this.problem || null === this.problemMark
            || this.contextMark.name !== this.problemMark.name
            || this.contextMark.line !== this.problemMark.line
            || this.contextMark.column !== this.problemMark.column)) {
      lines.push(this.contextMark.toString());
    }

    if (null !== this.problem) {
      lines.push(this.problem);
    }

    if (null !== this.problemMark) {
      lines.push(this.problemMark.toString(false));
    }

    if (null !== this.note) {
      lines.push(this.note);
    }

    return lines.join('\n');
  };

  this.toString = function toString(compact) {
    if (compact) {
      return this.toStringCompact();
    } else {
      return this.toStringFull();
    }

  };
}
$$.inherits(MarkedYAMLError, YAMLError);


module.exports.Mark = Mark;
module.exports.YAMLError = YAMLError;
module.exports.MarkedYAMLError = MarkedYAMLError;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
