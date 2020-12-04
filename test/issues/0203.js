'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Don\'t throw on warning', function () {
  var src = `
test: |-


  Hello
  world
`;

  assert.deepStrictEqual(yaml.load(src), { test: '\n\nHello\nworld' });
});
