'use strict';


var loader = require('./loader');
var dumper = require('./dumper');


function renamed(from, to) {
  return function () {
    throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' +
      'Use yaml.' + to + ' instead, which is now safe by default.');
  };
}


module.exports.Type                = require('./type');
module.exports.Schema              = require('./schema');
module.exports.FAILSAFE_SCHEMA     = require('./schema/failsafe');
module.exports.JSON_SCHEMA         = require('./schema/json');
module.exports.CORE_SCHEMA         = require('./schema/core');
module.exports.DEFAULT_SCHEMA      = require('./schema/default');
module.exports.load                = loader.load;
module.exports.loadAll             = loader.loadAll;
module.exports.dump                = dumper.dump;
module.exports.YAMLException       = require('./exception');

// Removed functions from JS-YAML 3.0.x
module.exports.safeLoad            = renamed('safeLoad', 'load');
module.exports.safeLoadAll         = renamed('safeLoadAll', 'loadAll');
module.exports.safeDump            = renamed('safeDump', 'dump');
