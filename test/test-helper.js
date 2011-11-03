//  stdlib
var fs = require('fs');


// current module
var exports = module.exports = {};


// internal helper to log colorized messages
var log = function log(color, prefix, message) {
  padding = ' ';

  while (16 > (prefix.length + padding.length)) {
    padding += ' ';
  }

  // colorize prefix
  prefix = '\033[' + color + 'm' + prefix + '\033[39m';

  // trim message length
  if (!!message && 64 < message.length) {
    message = message.slice(0, 61) + '...';
  }

  // output
  console.log(prefix + padding + message);
};


// concrete loggers
exports.warning = function warning(prefix, message) { log(33, prefix, message); };
exports.success = function success(prefix, message) { log(32, prefix, message); };
exports.failure = function failure(prefix, message) { log(31, prefix, message); };


// tests runner
exports.run = function run(root, regexp, success, failure) {
  fs.readdir(root, function (err, files) {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach(function (f) {
      if (!regexp.test(f)) {
        // skip non-tests
        return;
      }

      var test = require(root + '/' + f);

      try {
        test.execute();
        success(test);
      } catch (err) {
        failure(test);
        exports.warning('', err.toString());
      }
    });
  });
};
