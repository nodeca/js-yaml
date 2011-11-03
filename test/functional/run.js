// internal
var helper = require(__dirname + '/../test-helper');


var success = function (test) { helper.success('[PASS]', test.title); };
var failure = function (test) { helper.failure('[FAIL]', test.title); };


helper.run(__dirname, (/^test-.+\.js$/), success, failure);
