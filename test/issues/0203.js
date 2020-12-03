'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('Don\'t throw on warning', function () {
  var src = readFileSync(require('path').join(__dirname, '/0203.yml'), 'utf8');

  assert.deepStrictEqual(yaml.load(src), { test: '\n\nHello\nworld' });
});
