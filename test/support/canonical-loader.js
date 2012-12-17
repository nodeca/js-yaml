'use strict';


var _composer = require('../../lib/js-yaml/composer');
var _constructor = require('../../lib/js-yaml/constructor');
var _resolver = require('../../lib/js-yaml/resolver');
var _common = require('./common');
var CanonicalScanner = require('./canonical-scanner');
var CanonicalParser = require('./canonical-parser');


function CanonicalLoader(stream) {
  CanonicalScanner.call(this, stream);
  CanonicalParser.call(this);
  _composer.Composer.call(this);
  _constructor.Constructor.call(this);
  _resolver.Resolver.call(this);
}

_common.extend(CanonicalLoader.prototype,
               CanonicalScanner.prototype,
               CanonicalParser.prototype,
               _composer.Composer.prototype,
               _constructor.Constructor.prototype,
               _resolver.Resolver.prototype);


module.exports = CanonicalLoader;
