module.exports = function import() {
  var box = {}, i, each;

  each = function (src) {
    var mod = require('./' + src);
    Object.getOwnPropertyNames(mod).forEach(function (prop) {
      box[prop] = mod[prop];
    });
  };

  for (i = 0; i < arguments.length; i++) {
    each(arguments[i]);
  }

  return box;
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
