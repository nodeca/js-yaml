'use strict';


var path = require('path');
var fs   = require('fs');


suite('Units', function () {
  var directory = path.resolve(__dirname, 'units');

  fs.readdirSync(directory).forEach(function (file) {
    if (path.extname(file) === '.js') {
      require(path.resolve(directory, file));
    }
  });
});
