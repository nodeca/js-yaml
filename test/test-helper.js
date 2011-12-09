//  stdlib
var fs = require('fs'),
    path = require('path');


// internal
var $$ = require(__dirname + '/../lib/js-yaml/common');


// current module
var helper = module.exports = {};


// colorizes given text string
var colorize = function colorize(color, text) {
  return '\033[' + color + 'm' + text + '\033[39m';
};


var warning = function (message) { console.log(colorize(33, 'WARN') + ' ' + message); };
var success = function (message) { console.log(colorize(32, 'PASS') + ' ' + message); };
var failure = function (message) { console.log(colorize(31, 'FAIL') + ' ' + message); };
var generic = function (message) { console.log(colorize(31, '!!!!') + ' ' + message); };
var verbose = function (message) { console.log(colorize(90, '>>>>') + ' ' + message); };


var MAX_WIDTH = 70; // max width is 75 - 5 (code prefix with space)


var stats = {pass: 0, fail: 0, warn: 0, error: 0};


// wraps func into try-catch block
var execute = function execute(test, args, message) {
  try {
    test.execute.apply(test, args);

    // issue was not marked as fixed yet, but it pass test
    if (false === test.fixed) {
      warning(message);
      stats.warn += 1;
      return;
    }

    success(message);
    stats.pass += 1;
  } catch (err) {
    if ('AssertionError' === err.name) {
      failure(message);
      stats.fail += 1;
    } else {
      generic(message);
      stats.error += 1;
    }

    verbose(err);
  }
};


var shrink = function shrink(message, maxLength) {
  return (message + '').slice(0, maxLength - 3) + '...';
};


var findTestFilenames = function findTestFilenames(dataDir) {
  var filenames = {};
 
  fs.readdirSync(dataDir).forEach(function (file) {
    var ext = path.extname(file),
        base = path.basename(file, ext);

    if (undefined === filenames[base]) {
      filenames[base] = [];
    }

    filenames[base].push(ext);
  });

  return filenames;
};


// runs single test
var runTest = function runTest(root, file, test) {
  var message = file + ' // ' + (test.title || test.execute.name);

  // execute simple test
  if (!test.unittest) {
    execute(test, [], shrink(message, MAX_WIDTH));
    return;
  }

  // run unit tests for all found desired files
  $$.each(findTestFilenames(root + '/data'), function (exts, base) {
    var filenames = [], msgPrefix, msgSuffix;

    $$.each(test.unittest, function (ext) {
      if (0 <= exts.indexOf(ext)) {
        filenames.push(root + '/data/' + base + ext);
      }
    });

    if (filenames.length === test.unittest.length) {
      msgSuffix = ' (' + base + ')';
      msgPrefix = shrink(message, MAX_WIDTH - msgSuffix.length);
      execute(test, filenames, msgPrefix + msgSuffix);
    }
  });
};


// run tests
helper.run = function run(root, regexp) {
  var total = 0;

  fs.readdirSync(root).forEach(function (file) {

    if (!regexp.test(file)) {
      // skip non-test files
      return;
    }

    var tests = require(root + '/' + file);

    if (!Array.isArray(tests)) {
      tests = [tests];
    }

    tests.forEach(function (test) {
      runTest(root, file, test);
    });
  });

  total += stats.pass + stats.warn + stats.fail + stats.error;
  console.log(colorize(90, '----' + ' (' + total + ') ' +
                                    ' P:' + stats.pass + ' W:' + stats.warn +
                                    ' F:' + stats.fail + ' E:' + stats.error));

  // set correct error code on exit
  process.exit((stats.warn + stats.fail + stats.error) > 0 ? 1 : 0);
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
