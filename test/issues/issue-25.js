var issue = module.exports = {},
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-25.yml';

issue.title = "#25: Support for ?";
issue.fixed = false;
issue.execute = function () {
  var doc = require(source).shift();
  assert.equal(doc['a,b,c'], 123);
};
