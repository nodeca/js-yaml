'use strict';


function YAMLException(reason, mark) {
  this.name = 'YAMLException';
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


YAMLException.prototype.toString = function toString() {
  return this.message;
};


module.exports = YAMLException;
