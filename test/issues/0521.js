'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Don\'t quote strings with # without need', function () {
  var data = yaml.load(readFileSync(require('path').join(__dirname, '/0521.yml'), 'utf8'));

  var sample = {
    'http://example.com/page#anchor': 'no#quotes#required',
    'parameter#fallback': 'quotes #required',
    'foo #bar': 'key is quoted'
  };

  assert.deepStrictEqual(
    yaml.dump(sample),
    yaml.dump(data)
  );

});
