'use strict';


var JS = global.JS,
    exports = module.exports = {},
    $$ = require('./core'),
    _composer = require('./composer'),
    __ = $$.import('reader', 'scanner', 'parser', 'constructor', 'resolver');


JS.require('JS.Class');


exports.SafeLoader = new JS.Class('SafeLoader', {
  initialize: function (stream) {
    __.Reader.__init__(this, stream);
    __.Scanner.__init__(this);
    __.Parser.__init__(this);
    _composer.Composer.call(this);
    __.SafeConstructor.__init__(this);
    __.Resolver.__init__(this);
  }
});


exports.SafeLoader
  .include(__.Reader)
  .include(__.Scanner)
  .include(__.Parser)
  .include(__.SafeConstructor)
  .include(__.Resolver);

$$.merge(exports.SafeLoader.prototype, _composer.Composer.prototype);


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
