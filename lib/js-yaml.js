if (undefined === global.JSCLASS_PATH) {
  JSCLASS_PATH = require('path').resolve(__filename, '../../node_modules/jsclass/src');
  require(JSCLASS_PATH + '/loader');
}

exports.nodes = require('./js-yaml/nodes');
