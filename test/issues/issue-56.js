'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-56.yml';


module.exports = require('../helper').issue({
  title: "#56: Store large numbers as strings",
  fixed: true,
  test: function () {
    var data = require(source), expected = '', i;

    Assert.strictEqual(data.id, '72157630835074722');
    Assert.strictEqual(data.value, 721576308.35074722);
  }
});
