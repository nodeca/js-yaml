'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Timestamps are incorrectly parsed in local time', function () {
  var data = yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0046.yml'), 'utf8')),
      date1, date2;

  date1 = data.date1; // date1: 2010-10-20T20:45:00Z
  assert.strictEqual(date1.getUTCFullYear(), 2010, 'year');
  assert.strictEqual(date1.getUTCMonth(), 9, 'month');
  assert.strictEqual(date1.getUTCDate(), 20, 'date');
  assert.strictEqual(date1.getUTCHours(), 20);
  assert.strictEqual(date1.getUTCMinutes(), 45);
  assert.strictEqual(date1.getUTCSeconds(), 0);

  date2 = data.date2; // date2: 2010-10-20T20:45:00+0100
  assert.strictEqual(date2.getUTCFullYear(), 2010, 'year');
  assert.strictEqual(date2.getUTCMonth(), 9, 'month');
  assert.strictEqual(date2.getUTCDate(), 20, 'date');
  assert.strictEqual(date2.getUTCHours(), 19);
  assert.strictEqual(date2.getUTCMinutes(), 45);
  assert.strictEqual(date2.getUTCSeconds(), 0);
});
