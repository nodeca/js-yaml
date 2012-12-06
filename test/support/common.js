'use strict';


var assert = require('assert');
var $$ = require('../../lib/js-yaml/common');


var $$$ = module.exports = {};
$$.extend($$$, $$);


function kindOf(object) {
  return /\[object (.+?)\]/.exec(Object.prototype.toString.call(object))[1];
}


function areEqual(value1, value2) {
  var kind1 = kindOf(value1),
      kind2 = kindOf(value2);

  if (kind1 != kind2) {
    return false;
  } else if (Number.isNaN(value1) && Number.isNaN(value2)) {
    return true;
  } else {
    switch (kind1) {
      case 'Object': return areEqualObjects(value1, value2);
      case 'Array':  return areEqualArrays(value1, value2);
      case 'Date':   return value1.getTime() === value2.getTime();
      default:       return value1 === value2;
    }
  }
}


function areEqualArrays(array1, array2) {
  var index, length;

  if (array1.length !== array2.length) {
    return false;
  }

  for (index = 0, length = array1.length; index < length; index += 1) {
    if (!areEqual(array1[index], array2[index])) {
      return false;
    }
  }

  return true;
}


function areEqualObjects(object1, object2) {
  var keys1, keys2, index, length, currentKey;

  if (Object.getPrototypeOf(object1) !== Object.getPrototypeOf(object2)) {
    return false;
  }

  keys1 = Object.keys(object1);
  keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  keys1.sort();
  keys2.sort();

  length = keys1.length;

  for (index = 0; index < length; index += 1) {
    if (keys1[index] !== keys2[index]) {
      return false;
    }
  }

  for (index = 0; index < length; index += 1) {
    currentKey = keys1[index];

    if (!areEqual(object1[currentKey], object2[currentKey])) {
      return false;
    }
  }

  return true;
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


$$$.kindOf = kindOf;
$$$.areEqual = areEqual;
$$$.areEqualArrays = areEqualArrays;
$$$.areEqualObjects = areEqualObjects;
$$$.makeClassConstructor = makeClassConstructor;
