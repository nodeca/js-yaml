'use strict';


var common = require('./common');


function Schema(definition) {
  this.include  = definition.include  || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];
}


function compileList(schema, name, result) {
  var exclude = [];

  schema.include.forEach(function (includedSchema) {
    result = compileList(includedSchema, name, result);
  });

  schema[name].forEach(function (currentType) {
    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag) {
        exclude.push(previousIndex);
      }
    });
    
    result.push(currentType);
  });

  return result.filter(function (type, index) {
    return -1 === exclude.indexOf(index);
  });
}


Schema.prototype.compileImplicit = function compileImplicit() {
  return compileList(this, 'implicit', []);
};


Schema.prototype.compileExplicit = function compileExplicit() {
  return compileList(this, 'explicit', []);
};


Schema.prototype.compileMap = function compileMap() {
  var result = {};

  function collect(type) {
    result[type.tag] = type;
  }

  this.compileImplicit().forEach(collect);
  this.compileExplicit().forEach(collect);

  return result;
};


module.exports = Schema;
