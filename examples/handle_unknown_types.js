'use strict';

/*eslint-disable no-console*/

var fs   = require('fs');
var path = require('path');
var util = require('util');
var yaml = require('../');


var tags = [ 'scalar', 'sequence', 'mapping' ].map(function (kind) {
  // first argument here is a prefix, so this type will handle anything starting with !
  return new yaml.Type('!', {
    kind: kind,
    multi: true,
    construct: function (data, type) {
      return { type: type, data: data };
    }
  });
});

var SCHEMA = yaml.DEFAULT_SCHEMA.extend(tags);

// do not execute the following if file is required (http://stackoverflow.com/a/6398335)
if (require.main === module) {

  // And read a document using that schema.
  fs.readFile(path.join(__dirname, 'handle_unknown_types.yml'), 'utf8', function (error, data) {
    var loaded;

    if (!error) {
      loaded = yaml.load(data, { schema: SCHEMA });
      console.log(util.inspect(loaded, false, 20, true));
    } else {
      console.error(error.stack || error.message || String(error));
    }
  });
}

// There are some exports to play with this example interactively.
module.exports.tags    = tags;
module.exports.SCHEMA  = SCHEMA;
