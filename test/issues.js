'use strict';
/*global describe */


var path = require('path');
var fs   = require('fs');


describe('Issues.', function () {
  var issues = path.resolve(__dirname, 'issues');

  fs.readdirSync(issues).forEach(function (file) {
    if ('.js' === path.extname(file)) {
      require(path.resolve(issues, file));
    }
  });
});
