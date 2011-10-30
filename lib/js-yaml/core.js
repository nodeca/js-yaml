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


// <object> $$.extend(target, *sources)
//
// Copy all of the properties in the source objects over to the target object.
// It's in-order, so the last source will override properties of the same name
// in previous arguments.
//
// Example: var o = $$.extend({}, a, b, c);
$$.extend = function extend() {
  var target = arguments[0] || {}, i, l;

  for (i = 1, l = arguments.length; i < l; i++) {
    if (undefined !== arguments[i] && null !== arguments[i]) {
      Object.getOwnPropertyNames(arguments[i]).forEach(function (key) {
        target[key] = arguments[i][key];
      });
    }
  }

  return target;
};


// CLASSES
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
