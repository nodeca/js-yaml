#!/usr/bin/env node


// modules and helpers
var exists = require('path').existsSync,
    realpath = require('fs').realpathSync,
    read = require('fs').readFileSync,
    inspect = require('util').inspect,
    jsyaml = require(__dirname + '/../lib/js-yaml');


try {

  var options = require("nomnom")
    .scriptName("js-yaml.js")
    .opts({
      file: {
        position: 0,
        help: "YAML file to parse"
      },
      compact : {
        flag : true,
        string: '-c, --compact',
        help : 'compact error display'
      }
    })
    .parseArgs();

  var file = realpath(options.file);
  if (!exists(file)) {
    console.error("Specified file '" + options.file + "' not found");
    process.exit(1);
  }

  jsyaml.loadAll(read(file, 'utf8'), function (doc) {
    console.log('---------------------------------------------------------------------------');
    console.log(inspect(doc, false, 10, true));
    console.log('...........................................................................');
  });

  process.exit(0);
} catch (err) {
  console.error(err.stack || err.message || err.toString(options.compact));
  process.exit(1);
}
