'use strict';


var Type = require('../type');


function resolveYamlMerge(state) {
  return '<<' === state.result;
}


module.exports = new Type('tag:yaml.org,2002:merge', {
  loader: {
    kind: 'string',
    resolver: resolveYamlMerge
  }
});
