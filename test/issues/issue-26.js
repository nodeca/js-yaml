var issue = module.exports = {},
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-26.yml';

issue.title = "#26: should convert new line into white space";
issue.fixed = true;
issue.execute = function () {
  var doc = require(source).shift();
  assert.equal(doc.test, 'a b c\n');
};
