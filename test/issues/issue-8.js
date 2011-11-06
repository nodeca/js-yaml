var issue = module.exports = {},
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-8.yml';

issue.title = "#8: Parse failed when no document start present";
issue.fixed = true;
issue.execute = function () {
  assert.doesNotThrow(function () {
    require(source).shift();
  }, TypeError);
};
