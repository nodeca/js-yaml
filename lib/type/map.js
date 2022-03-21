'use strict';

var Type = require('../type');

module.exports = /*@__PURE__*/new Type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});
