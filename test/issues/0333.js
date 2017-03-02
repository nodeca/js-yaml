'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('should allow cast integers as !!float', function () {
  var data = yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0333.yml'), 'utf8'));

  assert.deepEqual(data, {
    negative: -1,
    zero: 0,
    positive: 23000
  });
});
