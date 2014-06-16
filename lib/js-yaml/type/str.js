'use strict';


var Type = require('../type');


module.exports = new Type('tag:yaml.org,2002:str', {
  loadKind: 'scalar',
  loadValidate: function () { return true; },
  loadCreate: function(data) { return data; }
});
