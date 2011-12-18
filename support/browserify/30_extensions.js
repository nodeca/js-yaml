// Extend prototypes and native objects for oldIEs, Safaies and Operas

if (!Array.isArray) {
  Array.isArray = function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };
}

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj) {
    var i;
    for (i=0; i < this.length; i++) {
      if (this[i] == obj) {
        return i;
      }
    }
    return -1;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (iterator, context) {
    var i, l;
    context = context || this;
    for (i = 0, l = this.length; i < l; i += 1) {
      iterator.call(context, this[i], i);
    }
  };
}

if (!Function.prototype.bind) {
  Function.prototype.bind = function bind(context) {
    var func = this;
    return function bound() {
      func.apply(context, arguments);
    };
  };
}

if (!Object.getOwnPropertyNames) {
  Object.getOwnPropertyNames = function getOwnPropertyNames(obj) {
    var names = [], key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        names.push(key);
      }
    }
    return names;
  };
}
