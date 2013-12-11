'use strict';


var Type = require('../type');


var YAML_IMPLICIT_BOOLEAN_MAP = {
  'true'  : true,
  'True'  : true,
  'TRUE'  : true,
  'false' : false,
  'False' : false,
  'FALSE' : false
};

var YAML_EXPLICIT_BOOLEAN_MAP = {
  'true'  : true,
  'True'  : true,
  'TRUE'  : true,
  'false' : false,
  'False' : false,
  'FALSE' : false,
  'y'     : true,
  'Y'     : true,
  'yes'   : true,
  'Yes'   : true,
  'YES'   : true,
  'n'     : false,
  'N'     : false,
  'no'    : false,
  'No'    : false,
  'NO'    : false,
  'on'    : true,
  'On'    : true,
  'ON'    : true,
  'off'   : false,
  'Off'   : false,
  'OFF'   : false
};


function resolveYamlBoolean(state, explicit) {
  var object = state.result;
  if (explicit) {
    if (YAML_EXPLICIT_BOOLEAN_MAP.hasOwnProperty(object)) {
      state.result = YAML_EXPLICIT_BOOLEAN_MAP[object];
      return true;
    } else {
      return false;
    }
  } else {
    if (YAML_IMPLICIT_BOOLEAN_MAP.hasOwnProperty(object)) {
      state.result = YAML_IMPLICIT_BOOLEAN_MAP[object];
      return true;
    } else {
      return false;
    }
  }
}


module.exports = new Type('tag:yaml.org,2002:bool', {
  loader: {
    kind: 'string',
    resolver: resolveYamlBoolean
  },
  dumper: {
    kind: 'boolean',
    defaultStyle: 'lowercase',
    representer: {
      lowercase: function (object) { return object ? 'true' : 'false'; },
      uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
      camelcase: function (object) { return object ? 'True' : 'False'; }
    }
  }
});
