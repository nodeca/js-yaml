module.exports = require('./lib/js-yaml.js');

if (window && !window.jsyaml) {
  window.jsyaml = module.exports;
}
