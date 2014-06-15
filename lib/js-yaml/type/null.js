'use strict';


var Type = require('../type');


function validateYamlNull(data) {
  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}


function resolveYamlNull() {
  return null;
}


function isNull(object) {
  return null === object;
}


module.exports = new Type('tag:yaml.org,2002:null', {
  loadKind: 'scalar',
  loadValidator: validateYamlNull,
  loadResolver: resolveYamlNull,
  dumpPredicate: isNull,
  dumpRepresenter: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; }
  },
  dumpDefaultStyle: 'lowercase'
});
