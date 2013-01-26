'use strict';


var jsyaml   = require('../../lib/js-yaml');
var _common  = require('./common');
var _classes = require('./classes');


module.exports = new jsyaml.Schema({
  include: [
    jsyaml.DEFAULT_SCHEMA
  ],
  explicit: [
    new jsyaml.Type('!tag1', _classes.Tag1.fromYAMLNode),
    new jsyaml.Type('!tag2', _classes.Tag2.fromYAMLNode),
    new jsyaml.Type('!tag3', _classes.Tag3.fromYAMLNode),
    new jsyaml.Type('!foo',  _classes.Foo.fromYAMLNode)
  ]
});
