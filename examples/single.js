var inspect = require('util').inspect,
    jsyaml = require(__dirname + '/../lib/js-yaml'),
    doc;

try {
  doc = require(__dirname + '/single.yml');
  console.log(inspect(doc, false, 10, true));
} catch (e) {
  console.log(e.stack || e.toString());
}
