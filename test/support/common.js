'use strict';


var assert = require('assert');
var path = require('path');
var fs = require('fs');
var $$ = require('../../lib/js-yaml/common');


var _common = module.exports = {};
$$.extend(_common, $$);


function isNothing(subject) {
  return (undefined === subject) || (null === subject);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) {
    return sequence;
  } else if (isNothing(sequence)) {
    return [];
  } else {
    return [ sequence ];
  }
}


function DataFile(filepath) {
  this.path = path.normalize(filepath);
  this.encoding = 'utf8';
  this.content = DataFile.read(this);
}


DataFile.read = function read(dataFile) {
  if ('.js' === path.extname(dataFile.path)) {
    return require(dataFile.path);
  } else {
    return fs.readFileSync(dataFile.path, dataFile.encoding);
  }
};


function makeClassConstructor(Class, params) {
  var mapKeys      = params.map      || {},
      requiredKeys = params.required || [],
      optionalKeys = params.optional || [];

  return function fromYAMLNode(node) {
    var mapping = this.constructMapping(node, true);

    assert.equal(typeof mapping, 'object');

    $$.each(mapKeys, function (newKey, oldKey) {
      if (mapping.hasOwnProperty(oldKey)) {
        mapping[newKey] = mapping[oldKey];
        delete mapping[oldKey];
      }
    });

    requiredKeys.forEach(function (key) {
      assert(mapping.hasOwnProperty(key),
        'Mapping must contain ' + JSON.stringify(key) + ' key');
    });

    $$.each(mapping, function (value, key) {
      var hasAsRequired = (0 <= requiredKeys.indexOf(key)),
          hasAsOptional = (0 <= optionalKeys.indexOf(key));

      assert((hasAsRequired || hasAsOptional),
        'Mapping should not contain ' + JSON.stringify(key) + ' key');
    });

    return new Class(mapping);
  };
}


_common.isNothing = isNothing;
_common.toArray = toArray;
_common.DataFile = DataFile;
_common.makeClassConstructor = makeClassConstructor;
