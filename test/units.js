'use strict';
/*global describe */


var path = require('path');
var fs   = require('fs');


describe('Units.', function () {
  var directory = path.resolve(__dirname, 'units');

  fs.readdirSync(directory).forEach(function (file) {
    if ('.js' === path.extname(file)) {
      require(path.resolve(directory, file));
    }
  });
});
