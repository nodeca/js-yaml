'use strict';


var Assert = require('assert');
var JsYaml = require('../../lib/js-yaml');
var source = __dirname + '/data/issue-17.yml';


module.exports = require('../helper').issue({
  title: "#17: Non-specific `!` tags should resolve to !!str",
  fixed: true,
  test: function () {
    var str = require(source).shift();
    Assert.equal('string', typeof str);
  }
});
