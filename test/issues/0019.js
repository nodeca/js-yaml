'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Timestamp parsing is one month off', function () {
  var data = yaml.load(`
---
xmas: 2011-12-24
...
`);

  // JS month starts with 0 (0 => Jan, 1 => Feb, ...)
  assert.strictEqual(data.xmas.getTime(), Date.UTC(2011, 11, 24));
});
