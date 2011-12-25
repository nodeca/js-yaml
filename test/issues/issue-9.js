'use strict';


var Assert = require('assert');
var JsYaml = require('../../lib/js-yaml');
var source = __dirname + '/data/issue-9.yml';


module.exports = require('../helper').issue({
  title: "#9: Reader fails on File Resource stream, when file is less than 4KB",
  fixed: true,
  test: function () {
    Assert.doesNotThrow(function () {
      var fs = require('fs'), fd = fs.openSync(source, 'r');

      JsYaml.load(fd);
      fs.closeSync(fd);
    }, Error);
  }
});
