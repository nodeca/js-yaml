var fs = require('fs');


var fixed = function () { console.log('[FIXED] ' + this.title); },
    broken = function () { console.log('[BROKEN] ' + this.title); };


fs.readdir(__dirname, function (err, files) {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach(function (f) {
    if (!/^issue-\d+\.js$/.test(f)) {
      // skip non-tests
      return;
    }

    var issue = require(__dirname + '/' + f);
    issue.test(fixed.bind(issue), broken.bind(issue));
  });
});
