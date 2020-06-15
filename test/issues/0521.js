'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Don\'t quote strings with # without need', function () {
  var required = readFileSync(require('path').join(__dirname, '/0521.yml'), 'utf8');
  var data = {
    'http://example.com/page#anchor': 'no:quotes#required',
    'parameter#fallback': 'quotes #required',
    'quotes: required': 'Visit [link](http://example.com/foo#bar)'
  };
  var actual = yaml.safeDump(data);
  assert.equal(actual, required);
});
