// internal
var helper = require(__dirname + '/../test-helper');


var success = function (test) {
  if (!!test.fixed) {
    helper.success('[FIXED]', test.title);
  } else {
    helper.failure('[BROKEN]', test.title);
  }
};

var failure = function (test) {
  if (!!test.fixed) {
    helper.failure('[REGRESSION]', test.title);
  } else {
    helper.warning('[NEW]', test.title);
  }
};


helper.run(__dirname, (/^issue-.+\.js$/), success, failure);
