'use strict';


var _errors = require('../../lib/js-yaml/errors');
var _common = require('./common');


function CanonicalError() {
  _errors.YAMLError.apply(this, arguments);
  this.name = 'CanonicalError';
}

_common.inherits(CanonicalError, _errors.YAMLError);


module.exports = CanonicalError;
