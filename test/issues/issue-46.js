'use strict';


var assert = require('assert');
var jsyaml = require('../../lib/js-yaml');
var _issues = require('../support/issues');


_issues.generateTests(46, {
  title: 'Timestamps are incorrectly parsed in local time',
  fixed: true,
  test: function (file) {
    var doc = jsyaml.load(file.content), date1, date2;

    date1 = doc.date1; // date1: 2010-10-20T20:45:00Z
    assert.equal(date1.getUTCFullYear(), 2010, 'year');
    assert.equal(date1.getUTCMonth(), 9, 'month');
    assert.equal(date1.getUTCDate(), 20, 'date');
    assert.equal(date1.getUTCHours(), 20);
    assert.equal(date1.getUTCMinutes(), 45);
    assert.equal(date1.getUTCSeconds(), 0);

    date2 = doc.date2; // date2: 2010-10-20T20:45:00+0100
    assert.equal(date2.getUTCFullYear(), 2010, 'year');
    assert.equal(date2.getUTCMonth(), 9, 'month');
    assert.equal(date2.getUTCDate(), 20, 'date');
    assert.equal(date2.getUTCHours(), 19);
    assert.equal(date2.getUTCMinutes(), 45);
    assert.equal(date2.getUTCSeconds(), 0);
  }
});
