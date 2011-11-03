var log = function log(color, prefix, message) {
  padding = ' ';

  while (16 > (prefix.length + padding.length)) {
    padding += ' ';
  }

  // colorize prefix
  prefix = '\033[' + color + 'm' + prefix + '\033[39m';

  // trim message length
  if (64 < message.length) {
    message = message.slice(0, 61) + '...';
  }

  // output
  console.log(prefix + padding + message);
};


module.exports = {
  message: function message(prefix, message) { log(33, prefix, message); },
  success: function success(prefix, message) { log(32, prefix, message); },
  failure: function failure(prefix, message) { log(31, prefix, message); }
};
