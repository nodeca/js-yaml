'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Non-specific "!" tags should resolve to !!str', function () {
  var data = yaml.load(`
! 12
`);

  assert.strictEqual(typeof data, 'string');
});
