//  stdlib
var fs = require('fs');


// internal
var helper = require(__dirname + '/../test-helper');


var success = function () { helper.success('[PASS]', this.title); };
var failure = function () { helper.failure('[FAIL]', this.title); };


fs.readdir(__dirname, function (err, files) {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach(function (f) {
    if (!/^test-\d+\.js$/.test(f)) {
      // skip non-tests
      return;
    }

    var test = require(__dirname + '/' + f);
    test.execute(success.bind(test), failure.bind(test));
  });
});
