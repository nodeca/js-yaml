var fs = require('fs'),
    jsyaml = require(__dirname + '/../lib/js-yaml'),
    source = __dirname + '/single.yml';

try {
  var str = fs.readFileSync(source, 'utf8');
  console.log(jsyaml.load(str));
} catch (e) {
  console.log(e.stack || e.toString());
}
