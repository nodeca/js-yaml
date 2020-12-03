'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('Non-specific "!" tags should resolve to !!str', function () {
  var data = yaml.load(readFileSync(require('path').join(__dirname, '/0017.yml'), 'utf8'));

  assert.strictEqual(typeof data, 'string');
});
