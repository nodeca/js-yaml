'use strict';


module.exports = function Schema(definition) {
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];
};
