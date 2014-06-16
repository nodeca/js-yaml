'use strict';


var Type = require('../type');


function validateYamlMerge(data) {
  return '<<' === data;
}

function createYamlMerge(data) {
  return data;
}


module.exports = new Type('tag:yaml.org,2002:merge', {
  loadKind: 'scalar',
  loadValidate: validateYamlMerge,
  loadCreate: createYamlMerge
});
