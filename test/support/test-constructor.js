'use strict';


var Constructor = require('../../lib/js-yaml/constructor').Constructor;

var $$$ = require('./common');
var _classes = require('./classes');


function TestConstructor() {
  Constructor.apply(this);
  this.yamlConstructors = TestConstructor.yamlConstructors;
}

$$$.inherits(TestConstructor, Constructor);
TestConstructor.yamlConstructors = $$$.extend({}, Constructor.yamlConstructors);
TestConstructor.addConstructor = Constructor.addConstructor;

TestConstructor.addConstructor('!tag1', _classes.Tag1.fromYAMLNode);
TestConstructor.addConstructor('!tag2', _classes.Tag2.fromYAMLNode);
TestConstructor.addConstructor('!tag3', _classes.Tag3.fromYAMLNode);
TestConstructor.addConstructor('!foo',  _classes.Foo.fromYAMLNode);


module.exports = TestConstructor;
