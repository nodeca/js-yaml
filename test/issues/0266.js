'use strict';


var assert = require('assert');
var yaml   = require('../../');


var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];


test('Dumper should not take into account booleans syntax from YAML 1.0/1.1 in noCompatMode', function () {
  DEPRECATED_BOOLEANS_SYNTAX.forEach(function (string) {
    var dump = yaml.dump(string, { noCompatMode: true }).trim();

    assert((dump === string),
           ('"' + string + '" string is not dumped as-is; actual dump: ' + dump));
  });
});
