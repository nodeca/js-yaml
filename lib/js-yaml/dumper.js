'use strict';


var YAMLException = require('./exception');


function dump(object, settings) {
  throw new YAMLException('the dumper is not implemented yet');
}


module.exports.dump = dump;
