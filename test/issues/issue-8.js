var issue = module.exports = {},
    fs = require('fs'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-8.yml';

issue.title = "#8: Parse failed when no document start present";
issue.fixed = false;
issue.test = function (fixed, broken) {
  try {
    doc = require(source).shift();
    ('bar' === doc.foo) ? fixed() : broken();
  } catch (err) {
    broken();
    return;
  }
};
