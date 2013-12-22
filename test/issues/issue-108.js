'use strict';
/*global it */


var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


it('Literal scalars have an unwanted leading line break', function () {
  assert.strictEqual(yaml.load('|\n  foobar'),              'foobar');
  assert.strictEqual(yaml.load('|\n  hello\n  world'),      'hello\nworld');
  assert.strictEqual(yaml.load('|\n  war never changes\n'), 'war never changes\n');
});
