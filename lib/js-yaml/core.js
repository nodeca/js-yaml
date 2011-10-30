var $$ = module.exports = {};


// UTILITY METHODS
////////////////////////////////////////////////////////////////////////////////


// returns object with exported properties of all required modules
// example: var __ = $$.import('errors', 'nodes');
$$.import = function import() {
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


// iterates through all object keys-value pairs calling iterator on each one
// example: $$.each(hash, function (val, key) { /* ... */ });
$$.each = function each(obj, iterator, context) {
  var keys = Object.getOwnPropertyNames(obj), i, l;

  context = context || iterator;

  for (i = 0, l = keys.length; i < l; i++) {
    iterator.call(context, obj[keys[i]], keys[i], obj);
  }
};


// CLASSES
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
