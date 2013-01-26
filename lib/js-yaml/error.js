'use strict';


function YAMLError(reason, mark) {
  this.name = 'YAMLError';
  this.message = 'JS-YAML: ';

  if (reason) {
    this.message += reason;
  } else {
    this.message += '(unknown reason)';
  }

  if (mark) {
    this.message += ' ' + mark.toString();
  }
}


YAMLError.prototype.toString = function toString() {
  return this.message;
};


module.exports = YAMLError;
