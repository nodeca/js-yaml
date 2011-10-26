var DEBUG_ENABLED = (1 === +process.env['JSYAML_DEBUG']);
var MAX_CALLS = +process.env['JSYAML_MAX_CALLS'];
var i = 1;


var debug = function debug(msg, params) {
  console.log('*** ' + msg + ' [' + i + ']');

  if ('object' === typeof params) {
    Object.getOwnPropertyNames(params).forEach(function (k) {
      var v = params[k], t = typeof v;
      console.log('    ' + k + ': <' + t + '> (' + v + ')');
    });
  }

  console.log('------------------------------------------------------------');

  if (0 < MAX_CALLS && i >= MAX_CALLS) {
    throw Error('JSYAML_MAX_CALLS reached');
  }

  i++;
};


module.exports = DEBUG_ENABLED ? debug : function () {};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
