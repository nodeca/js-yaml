'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Don\'t throw on warning', function () {
  var src = readFileSync(require('path').join(__dirname, '/0335.yml'), 'utf8');

  assert.deepEqual(yaml.safeLoad(src), {
    not_num_1: '-_123',
    not_num_2: '_123',
    not_num_3: '123_',
    not_num_4: '0b00_',
    not_num_5: '0x00_',
    not_num_6: '011_'
  });
});
