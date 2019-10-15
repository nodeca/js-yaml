'use strict';

var assert = require('assert');
var yaml   = require('../../');

test('Dumper should add quotes around equals sign', function () {
  // pyyaml fails with unquoted `=`
  // https://yaml-online-parser.appspot.com/?yaml=%3D%0A&type=json
  assert.strictEqual(yaml.load(yaml.dump('=')), '=');
  assert.strictEqual(yaml.dump('='), "'='\n");
});
