var issue = module.exports = {},
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-19.yml';

issue.title = "#19: Timestamp parsing is one month off";
issue.fixed = true;
issue.execute = function () {
  var doc = require(source).shift(),
      expected = new Date(2011, 11, 24);
  // JS month starts with 0 (0 => Jan, 1 => Feb, ...)
  assert.equal(doc.xmas.getTime(), expected.getTime());
};
