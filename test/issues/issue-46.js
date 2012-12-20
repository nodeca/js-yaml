'use strict';
/*global it */


var assert = require('assert');

require('../../lib/js-yaml');


it('#46: Timestamps are incorrectly parsed in local time', function () {
  var data = require('./data/issue-46.yml'), date1, date2;

  date1 = data.date1; // date1: 2010-10-20T20:45:00Z
  assert.equal(date1.getUTCFullYear(), 2010, 'year');
  assert.equal(date1.getUTCMonth(), 9, 'month');
  assert.equal(date1.getUTCDate(), 20, 'date');
  assert.equal(date1.getUTCHours(), 20);
  assert.equal(date1.getUTCMinutes(), 45);
  assert.equal(date1.getUTCSeconds(), 0);

  date2 = data.date2; // date2: 2010-10-20T20:45:00+0100
  assert.equal(date2.getUTCFullYear(), 2010, 'year');
  assert.equal(date2.getUTCMonth(), 9, 'month');
  assert.equal(date2.getUTCDate(), 20, 'date');
  assert.equal(date2.getUTCHours(), 19);
  assert.equal(date2.getUTCMinutes(), 45);
  assert.equal(date2.getUTCSeconds(), 0);
});
