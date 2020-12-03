'use strict';


var assert = require('assert');
var yaml   = require('../../');


it('Should check kind type when resolving !<?> tag', function () {
  try {
    yaml.load('!<?> [0]');
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: unacceptable node kind for !<?> tag'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});
