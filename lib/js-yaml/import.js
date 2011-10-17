module.exports = function import() {
  var box = {}, i;

  for (i = 0; i < arguments.length; i++) {
    (function (src) {
      var mod = require('./' + src);
      Object.getOwnPropertyNames(mod).forEach(function (prop) {
        box[prop] = mod[prop];
      });
    })(arguments[i]);
  }

  return box;
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
