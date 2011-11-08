'use strict';


var JS = global.JS,
    exports = module.exports = {},
    $$ = require('./core'),
    _reader = require('./reader'),
    _parser = require('./parser'),
    _composer = require('./composer'),
    _resolver = require('./resolver'),
    _constructor = require('./constructor'),
    __ = $$.import('scanner');


JS.require('JS.Class');


exports.SafeLoader = new JS.Class('SafeLoader', {
  initialize: function (stream) {
    _reader.Reader.call(this, stream);
    __.Scanner.__init__(this);
    _parser.Parser.call(this);
    _composer.Composer.call(this);
    _constructor.SafeConstructor.call(this);
    _resolver.Resolver.call(this);
  }
});


exports.SafeLoader
  .include(__.Scanner);


$$.merge(exports.SafeLoader.prototype,
         _reader.Reader.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _resolver.Resolver.prototype,
         _constructor.SafeConstructor.prototype);


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
