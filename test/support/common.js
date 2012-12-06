'use strict';


var assert = require('assert');
var $$ = require('../../lib/js-yaml/common');


var _common = module.exports = {};
$$.extend(_common, $$);


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


_common.makeClassConstructor = makeClassConstructor;
