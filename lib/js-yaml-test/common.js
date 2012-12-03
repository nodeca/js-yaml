'use strict';


var assert = require('assert');
var $$ = require('../js-yaml/common');


var $$$ = module.exports = {};
$$.extend($$$, $$);


function areEqualObjects(object1, object2) {
  var key;

  if (('object' == typeof object1) &&
      ('object' == typeof object2)) {
    if (Object.getPrototypeOf(object1) !== Object.getPrototypeOf(object2)) {
      return false;
    }

    for (key in object1) {
      if (Object.prototype.hasOwnProperty.call(object1, key) &&
         !Object.prototype.hasOwnProperty.call(object2, key)) {
        return false;
      }
    }

    return true;
  } else {
    return object1 === object2;
  }
}


function makeClassConstructor(Class, params) {
  var mapKeys      = params.map      || {},
      requiredKeys = params.required || [],
      optionalKeys = params.optional || [];

  return function fromYAMLNode(node) {
    var mapping = this.constructMapping(node, true);

    assert.equal(typeof mapping, 'object');

    $$.each(mapKeys, function (newKey, oldKey) {
      if (Object.prototype.hasOwnProperty.call(mapping, oldKey)) {
        mapping[newKey] = mapping[oldKey];
        delete mapping[oldKey];
      }
    });

    requiredKeys.forEach(function (key) {
      assert(Object.prototype.hasOwnProperty.call(mapping, key));
    });

    $$.each(mapping, function (value, key) {
      var hasAsRequired = (0 <= requiredKeys.indexOf(key)),
          hasAsOptional = (0 <= optionalKeys.indexOf(key));

      assert(hasAsRequired || hasAsOptional);
    });

    return new Class(mapping);
  };
}


$$$.areEqualObjects      = areEqualObjects;
$$$.makeClassConstructor = makeClassConstructor;
