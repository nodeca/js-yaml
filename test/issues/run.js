//  stdlib
var fs = require('fs');


// internal
var helper = require(__dirname + '/../test-helper');


var success = function () {
  if (!!this.fixed) {
    helper.success('[FIXED]', this.title);
  } else {
    helper.failure('[BROKEN]', this.title);
  }
};

var failure = function () {
  if (!!this.fixed) {
    helper.failure('[REGRESSION]', this.title);
  } else {
    helper.message('[NEW]', this.title);
  }
};


fs.readdir(__dirname, function (err, files) {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach(function (f) {
    if (!/^issue-\d+\.js$/.test(f)) {
      // skip non-tests
      return;
    }

    var test = require(__dirname + '/' + f);
    test.execute(success.bind(test), failure.bind(test));
  });
});
