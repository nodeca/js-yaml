'use strict';


var jsyaml  = require('../../lib/js-yaml');
var classes = require('./classes');


module.exports = new jsyaml.Schema({
  include: [
    jsyaml.DEFAULT_SCHEMA
  ],
  explicit: [
    new jsyaml.Type('!tag1', {
      loader: {
        kind: 'object',
        resolver: classes.Tag1.fromYAMLNode
      }
    }),
    new jsyaml.Type('!tag2', {
      loader: {
        kind: 'string',
        resolver: classes.Tag2.fromYAMLNode
      }
    }),
    new jsyaml.Type('!tag3', {
      loader: {
        kind: 'object',
        resolver: classes.Tag3.fromYAMLNode
      }
    }),
    new jsyaml.Type('!foo', {
      loader: {
        kind: 'object',
        resolver: classes.Foo.fromYAMLNode
      }
    })
  ]
});
