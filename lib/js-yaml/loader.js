'use strict';


var JS = global.JS,
    exports = module.exports = {},
    __ = require('./core').import('reader', 'scanner', 'parser', 'composer', 'constructor', 'resolver');


JS.require('JS.Class');


exports.SafeLoader = new JS.Class('SafeLoader', {
  initialize: function (stream) {
    __.Reader.__init__(this, stream);
    __.Scanner.__init__(this);
    __.Parser.__init__(this);
    __.Composer.__init__(this);
    __.SafeConstructor.__init__(this);
    __.Resolver.__init__(this);
  }
});


exports.SafeLoader
  .include(__.Reader)
  .include(__.Scanner)
  .include(__.Parser)
  .include(__.Composer)
  .include(__.SafeConstructor)
  .include(__.Resolver);


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
