var fs = require('fs'),
    jsyaml = require(__dirname + '/../lib/js-yaml'),
    source = __dirname + '/single.yml';

try {
  fs.open(source, 'r', function (err, fd) {
    console.log(jsyaml.load(fd));
  });
} catch (e) {
  console.log(e.stack || e.toString());
}
