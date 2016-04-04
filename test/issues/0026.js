'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('should convert new line into white space', function () {
  var data = yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0026.yml'), 'utf8'));

  assert.strictEqual(data.test, 'a b c\n');
});
