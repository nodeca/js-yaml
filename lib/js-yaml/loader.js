'use strict';


var JS = global.JS,
    exports = module.exports = {},
    $$ = require('./core'),
    _composer = require('./composer'),
    _resolver = require('./resolver'),
    __ = $$.import('reader', 'scanner', 'parser', 'constructor');


JS.require('JS.Class');


exports.SafeLoader = new JS.Class('SafeLoader', {
  initialize: function (stream) {
    __.Reader.__init__(this, stream);
    __.Scanner.__init__(this);
    __.Parser.__init__(this);
    _composer.Composer.call(this);
    __.SafeConstructor.__init__(this);
    _resolver.Resolver.call(this);
  }
});


exports.SafeLoader
  .include(__.Reader)
  .include(__.Scanner)
  .include(__.Parser)
  .include(__.SafeConstructor);

$$.merge(exports.SafeLoader.prototype, _composer.Composer.prototype);
$$.merge(exports.SafeLoader.prototype, _resolver.Resolver.prototype);


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
