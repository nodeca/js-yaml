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

var schema = yaml.DEFAULT_SCHEMA.extend(tags);


it('Process tag with kind: scalar', function () {
  assert.deepStrictEqual(yaml.load('!Include foobar', {
    schema: schema
  }), 'foobar');
});


it('Process tag with kind: mapping', function () {
  assert.deepStrictEqual(yaml.load('!Include\n  location: foobar', {
    schema: schema
  }), { location: 'foobar' });
});
