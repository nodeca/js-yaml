'use strict';


var jsyaml  = require('../../lib/js-yaml');
var classes = require('./classes');


module.exports = new jsyaml.Schema({
  include: [
    jsyaml.DEFAULT_FULL_SCHEMA
  ],
  explicit: [
    new jsyaml.Type('!tag3', {
      loadKind: 'mapping',
      loadResolver: classes.Tag3.fromYAMLNode,
      dumpInstanceOf: classes.Tag3,
      dumpRepresenter: classes.Tag3.toYAMLNode
    }),
    new jsyaml.Type('!tag2', {
      loadKind: 'scalar',
      loadResolver: classes.Tag2.fromYAMLNode,
      dumpInstanceOf: classes.Tag2,
      dumpRepresenter: classes.Tag2.toYAMLNode
    }),
    new jsyaml.Type('!tag1', {
      loadKind: 'mapping',
      loadResolver: classes.Tag1.fromYAMLNode,
      dumpInstanceOf: classes.Tag1
    }),
    new jsyaml.Type('!foo', {
      loadKind: 'mapping',
      loadResolver: classes.Foo.fromYAMLNode,
      dumpInstanceOf: classes.Foo,
      dumpRepresenter: classes.Foo.toYAMLNode
    })
  ]
});
