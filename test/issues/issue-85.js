'use strict';
/*global it */


var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];


it('Dumper should take into account booleans syntax from YAML 1.0/1.1', function () {
  DEPRECATED_BOOLEANS_SYNTAX.forEach(function (string) {
    var dump = yaml.dump(string).trim();

    assert(((dump === "'" + string + "'") || (dump === '"' + string + '"')),
           ('"' + string + '" string is dumped without quoting; actual dump: ' + dump));
  });
});
