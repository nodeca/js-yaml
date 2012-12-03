(function () {
  'use strict';

  // getOwnPropertyNames shim for IE7. Thanks to @Fanjita
  // Not using es5-shams as they give more problems. See:
  // https://github.com/nodeca/js-yaml/issues/49#issuecomment-10963606
  if ('function' !== typeof Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(obj) {
      var keys = [], k;

      // Only iterate the keys if we were given an object, and
      // a special check for null, as typeof null == "object"
      if (!!obj && 'object' === typeof obj) {
        // Use a standard for in loop
        for (k in obj) {
          // A for in will iterate over members on the prototype
          // chain as well, but Object.getOwnPropertyNames returns
          // only those directly on the object, so use hasOwnProperty.
          if (obj.hasOwnProperty(k)) {
            keys.push(k);
          }
        }
      }

      return keys;
    };
  }
}());
