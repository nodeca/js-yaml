var fs = require('fs'),
    inspect = require('util').inspect,
    jsyaml = require(__dirname + '/../lib/js-yaml'),
    source = __dirname + '/single.yml';

try {
  fs.open(source, 'r', function (err, fd) {
    if (err) {
      console.error(err);
      return;
    }

    var doc = jsyaml.load(fd);
    console.log(inspect(doc, false, 10));
  });
} catch (e) {
  console.log(e.stack || e.toString());
}
