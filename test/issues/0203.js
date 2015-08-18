'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Don\'t throw on warning', function () {
  var src = readFileSync(require('path').join(__dirname, '/0203.yml'), 'utf8');

  assert.deepEqual(yaml.safeLoad(src), { test: '\n\nHello\nworld' });
});
