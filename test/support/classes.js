'use strict';


var $$$ = require('./common');


function Tag1(parameters) {
  this.x = parameters.x;
  this.y = parameters.y || 0;
  this.z = parameters.z || 0;
}

Tag1.fromYAMLNode = $$$.makeClassConstructor(Tag1, {
  required: ['x'],
  optional: ['y', 'z']
});


function Tag2() {
  Tag1.apply(this, arguments);
}

$$$.inherits(Tag2, Tag1);

Tag2.fromYAMLNode = function fromYAMLNode(node) {
  return new Tag2({
    x: this.constructYamlInt(node)
  });
};


function Tag3() {
  Tag2.apply(this, arguments);
}

$$$.inherits(Tag3, Tag2);

Tag3.fromYAMLNode = $$$.makeClassConstructor(Tag3, {
  map: { '=': 'x' },
  required: ['x'],
  optional: ['y', 'z']
});


function Foo(parameters) {
  this.myParameter        = parameters.myParameter;
  this.myAnotherParameter = parameters.myAnotherParameter;
}

Foo.fromYAMLNode = $$$.makeClassConstructor(Foo, {
  map: {
    'my-parameter':         'myParameter',
    'my-another-parameter': 'myAnotherParameter'
  },
  optional: ['myParameter', 'myAnotherParameter']
});


module.exports.Tag1 = Tag1;
module.exports.Tag2 = Tag2;
module.exports.Tag3 = Tag3;
module.exports.Foo  = Foo;
