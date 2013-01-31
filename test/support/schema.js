'use strict';


var jsyaml  = require('../../lib/js-yaml');
var classes = require('./classes');


module.exports = new jsyaml.Schema({
  include: [
    jsyaml.DEFAULT_SCHEMA
  ],
  explicit: [
    new jsyaml.Type('!tag1', classes.Tag1.fromYAMLNode),
    new jsyaml.Type('!tag2', classes.Tag2.fromYAMLNode),
    new jsyaml.Type('!tag3', classes.Tag3.fromYAMLNode),
    new jsyaml.Type('!foo',  classes.Foo.fromYAMLNode)
  ]
});
