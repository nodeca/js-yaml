'use strict';

var $$ = module.exports = {};


// UTILITY METHODS
////////////////////////////////////////////////////////////////////////////////


// returns object with exported properties of all required modules
// example: var __ = $$.import('errors', 'nodes');
$$.import = function import_modules() {
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
  var keys, i, l;

  if (null === obj || undefined === obj) {
    return;
  }

  context = context || iterator;

  if (obj.forEach === Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else {
    keys = Object.getOwnPropertyNames(obj);
    for (i = 0, l = keys.length; i < l; i++) {
      iterator.call(context, obj[keys[i]], keys[i], obj);
    }
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
  var args = arguments, target = args[0] || {}, i, l, iterator;

  iterator = function (key) {
    target[key] = args[i][key];
  };

  for (i = 1, l = arguments.length; i < l; i++) {
    if (undefined !== arguments[i] && null !== arguments[i]) {
      Object.getOwnPropertyNames(arguments[i]).forEach(iterator);
    }
  }

  return target;
};


// returns reversed copy of array
$$.reverse = function reverse(arr) {
  var result = [], i, l;
  for (i = 0, l = arguments.length; i < l; i++) {
    result.unshift(arr[i]);
  }
  return result;
};


// CLASSES
////////////////////////////////////////////////////////////////////////////////


// Dummy alternative of delayed population based on generators in PyYAML
$$.Populator = function Populator(data, callback, context) {
  if (!(this instanceof $$.Populator)) {
    return new $$.Populator(data, callback, context);
  }

  this.data = data;
  this.execute = function () {
    callback.call(context || callback);
  };
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
