try {
  var str = require('fs').readFileSync(__dirname + '/demo.yml', 'utf8'),
      yaml = require(__dirname + '/../lib/js-yaml'),
      doc = yaml.loadAll(str).shift();
  console.log(doc);
  console.log(doc.pairs);
} catch (e) {
  console.log(e.toString());
  console.log(e.stack);
}
