#!/usr/bin/env node

// stdlib
var fs    = require('fs');


// 3rd-party
var program = require('commander');


// internal
var yaml = require('..');


var options = program
  .version(require('../package.json').version)
  .usage('[-v|-h] [-t] [-c] [file]')
  .option('-t, --trace', 'Show stack trace on error')
  .option('-c, --compact', 'Display errors in compact mode')
  .option('-v, --version', 'Show program version and exit')
  .on('--help', function() {
    console.log('')
    console.log('  Positional arguments:')
    console.log('')
    console.log('    file           File to read, utf-8 encoded without BOM')
    console.log('')
  })
  .parse(process.argv)

var filename = options.args.shift()

////////////////////////////////////////////////////////////////////////////////

function readFile(filename, encoding, callback) {
  if (!options.file) {
    // read from stdin

    var chunks = [];

    process.stdin.on('data', function (chunk) {
      chunks.push(chunk);
    });

    process.stdin.on('end', function () {
      return callback(null, Buffer.concat(chunks).toString(encoding));
    });
  } else {
    fs.readFile(filename, encoding, callback);
  }
}

readFile(filename, 'utf8', function (error, input) {
  var output, isYaml;

  if (error) {
    if (error.code === 'ENOENT') {
      console.error('File not found: ' + options.file);
      process.exit(2);
    }

    console.error(
      options.trace && error.stack ||
      error.message ||
      String(error));

    process.exit(1);
  }

  try {
    output = JSON.parse(input);
    isYaml = false;
  } catch (error) {
    if (error instanceof SyntaxError) {
      try {
        output = [];
        yaml.loadAll(input, function (doc) { output.push(doc); }, {});
        isYaml = true;

        if (0 === output.length) {
          output = null;
        } else if (1 === output.length) {
          output = output[0];
        }
      } catch (error) {
        if (options.trace && error.stack) {
          console.error(error.stack);
        } else {
          console.error(error.toString(options.compact));
        }

        process.exit(1);
      }
    } else {
      console.error(
        options.trace && error.stack ||
        error.message ||
        String(error));

      process.exit(1);
    }
  }

  if (isYaml) {
    console.log(JSON.stringify(output, null, '  '));
  } else {
    console.log(yaml.dump(output));
  }

  process.exit(0);
});
