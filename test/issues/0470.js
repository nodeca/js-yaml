'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Don\'t quote strings with : without need', function () {
  var data = {
    // no quotes needed
    'http://example.com': 'http://example.com',
    // quotes required
    'foo: bar': 'foo: bar',
    'foo:': 'foo:'
  };

  var expected = `
http://example.com: http://example.com
'foo: bar': 'foo: bar'
'foo:': 'foo:'
`.replace(/^\n/, '');

  assert.strictEqual(yaml.dump(data), expected);
  assert.deepStrictEqual(yaml.load(expected), data);
});
