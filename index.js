'use strict';


var fs   = require('fs');
var yaml = require('./lib/js-yaml.js');


require.extensions['.yml'] = require.extensions['.yaml'] = function (m, f) {
  m.exports = yaml.safeLoad(fs.readFileSync(f, 'utf8'), { filename: f });
};


module.exports = yaml;
