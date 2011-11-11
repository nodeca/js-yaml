var issue = module.exports = {},
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-17.yml';

issue.title = "#17: Non-specific `!` tags should resolve to !!str";
issue.fixed = true;
issue.execute = function () {
  var str = require(source).shift();
  assert.equal('string', typeof str);
};
