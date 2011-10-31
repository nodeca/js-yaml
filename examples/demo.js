try {
  var str = require('fs').readFileSync(__dirname + '/demo.yml', 'utf8'),
      yaml = require(__dirname + '/../lib/js-yaml');
  console.log(yaml.loadAll(str));
} catch (e) {
  console.log(e.toString());
  console.log(e.stack);
}
