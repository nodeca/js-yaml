'use strict';


var path = require('path');
var fs   = require('fs');


suite('Issues', function () {
  var issues = path.resolve(__dirname, 'issues');

  fs.readdirSync(issues).forEach(function (file) {
    if (path.extname(file) === '.js') {
      require(path.resolve(issues, file));
    }
  });
});
