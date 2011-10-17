JS.require('JS.Class');


var __ = require('./import')('reader', 'scanner', 'parser', 'composer', 'constructor', 'resolver');

exports.SafeLoader = new JS.Class('SafeLoader', {
  initialize: function (stream) {
    (new __.Reader).initialize.call(this, stream);
    (new __.Scanner).initialize.call(this);
    (new __.Parser).initialize.call(this);
    (new __.Composer).initialize.call(this);
    (new __.SafeConstructor).initialize.call(this);
    (new __.Resolver).initialize.call(this);
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
