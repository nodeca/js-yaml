'use strict';

var Assert = require('assert');
var JsYaml = require('../../lib/js-yaml');
var source = __dirname + '/data/issue-54.yml';


module.exports = require('../helper').issue({
  title: "#54: Incorrect utf-8 handling on require('file.yaml')",
  fixed: false,
  test: function () {
    var data = require(source), expected = '', i;

    //
    // document is an array of 40 elements
    // each element is a string of 100 `у` (Russian letter) chars
    //

    for (i = 0; i <= 100; i++) {
      expected += 'у';
    }

    //
    // make sure none of the strings were corrupted.
    //

    for (i = 0; i < 40; i++) {
      Assert.equal(data[i], expected, 'Line ' + i + ' is corrupted');
    }
  }
});
