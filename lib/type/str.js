'use strict';

var Type = require('../type');

module.exports = /*@__PURE__*/new Type('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});
