// TODO: replace with VOWS based testing


var fs = require('fs');


// Legend:
//
// [NEW]        -- Issue test cse created. No fix available.
// [FIXED]      -- Issue fix ready.
// [REGRESION]  -- Issue was fixed, but appears again
// [BROKEN]     -- Issue was not yet fixed, but does not appear anymore


var fixed = function () {
      var code = (!!this.fixed) ? '[FIXED]' : '[BROKEN]';
      console.log(code + ' ' + this.title);
    },
    broken = function () {
      var code = (!!this.fixed) ? '[REGRESSION]' : '[NEW]';
      console.log(code + ' ' + this.title);
    };


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
