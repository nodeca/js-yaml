var issue = module.exports = {},
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    source = __dirname + '/data/issue-9.yml';

issue.title = "#9: Reader fails on File Resource stream, when file is less than 4KB";
issue.fixed = true;
issue.execute = function () {
  var fs = require('fs'),
      fd = fs.openSync(source, 'r');

  jsyaml.load(fd);
  fs.closeSync(fd);
};
