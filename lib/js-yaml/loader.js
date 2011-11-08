'use strict';


var JS = global.JS,
    exports = module.exports = {},
    $$ = require('./core'),
    _reader = require('./reader'),
    _scanner = require('./scanner'),
    _parser = require('./parser'),
    _composer = require('./composer'),
    _resolver = require('./resolver'),
    _constructor = require('./constructor');


JS.require('JS.Class');


exports.SafeLoader = new JS.Class('SafeLoader', {
  initialize: function (stream) {
    _reader.Reader.call(this, stream);
    _scanner.Scanner.call(this);
    _parser.Parser.call(this);
    _composer.Composer.call(this);
    _constructor.SafeConstructor.call(this);
    _resolver.Resolver.call(this);
  }
});


$$.merge(exports.SafeLoader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _resolver.Resolver.prototype,
         _constructor.SafeConstructor.prototype);


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
