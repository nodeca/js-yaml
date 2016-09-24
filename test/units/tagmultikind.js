'use strict';


var assert = require('assert');
var yaml = require('../../');

var tags = [ {
  tag: 'Include',
  type: 'scalar'
}, {
  tag: 'Include',
  type: 'mapping'
} ].map(function (fn) {
  return new yaml.Type('!' + fn.tag, {
    kind: fn.type,
    resolve: function () {
      return true;
    },
    construct: function (obj) {
      return obj;
    }
  });
});

var schema = yaml.Schema.create(tags);


test('Process tag with kind: scalar', function () {
  assert.deepEqual(yaml.safeLoad('!Include foobar', {
    schema: schema
  }), 'foobar');
});


test('Process tag with kind: mapping', function () {
  assert.deepEqual(yaml.safeLoad('!Include\n  location: foobar', {
    schema: schema
  }), { location: 'foobar' });
});
