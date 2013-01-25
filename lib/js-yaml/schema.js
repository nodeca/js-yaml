'use strict';


function Schema(definition) {
  this.include  = definition.include  || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];
}


Schema.prototype.compileImplicit = function compileImplicit(result) {
  var index, length, type;

  if (!result) {
    result = [];
  }

  for (index = 0, length = this.implicit.length; index < length; index += 1) {
    type = this.implicit[index];
    
    if (-1 === result.indexOf(type)) {
      result.push(type);
    }
  }

  for (index = 0, length = this.include.length; index < length; index += 1) {
    result = this.include[index].compileImplicit(result);
  }

  return result;
};


Schema.prototype.compileExplicit = function compileExplicit(result) {
  var index, length, type;

  if (!result) {
    result = {};
  }

  for (index = 0, length = this.include.length; index < length; index += 1) {
    result = this.include[index].compileExplicit(result);
  }

  for (index = 0, length = this.implicit.length; index < length; index += 1) {
    type = this.implicit[index];
    result[type.tag] = type;
  }

  for (index = 0, length = this.explicit.length; index < length; index += 1) {
    type = this.explicit[index];
    result[type.tag] = type;
  }

  return result;
};


module.exports = Schema;
