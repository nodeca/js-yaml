'use strict';


var Type = require('../type');


module.exports = new Type('tag:yaml.org,2002:str', {
  loadKind: 'scalar',
  loadValidator: function () { return true; },
  loadResolver: function(data) { return data; }
});
