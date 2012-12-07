'use strict';


var path = require('path');
var fs = require('fs');


function DataFile(filepath) {
  this.path = path.normalize(filepath);
  this.encoding = 'utf8';
  this.content = DataFile.read(this);
}


DataFile.read = function read(dataFile) {
  if ('.js' === path.extname(dataFile.path)) {
    return require(dataFile.path);
  } else {
    return fs.readFileSync(dataFile.path, dataFile.encoding);
  }
};


module.exports = DataFile;
