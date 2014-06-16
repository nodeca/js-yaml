'use strict';

var util = require('util');
var yaml = require('../../lib/js-yaml');

function Tag1(parameters) {
  this.x = parameters.x;
  this.y = parameters.y || 0;
  this.z = parameters.z || 0;
}

function Tag2() {
  Tag1.apply(this, arguments);
}
util.inherits(Tag2, Tag1);

function Tag3() {
  Tag2.apply(this, arguments);
}
util.inherits(Tag3, Tag2);

function Foo(parameters) {
  this.myParameter        = parameters.myParameter;
  this.myAnotherParameter = parameters.myAnotherParameter;
}

var TEST_SCHEMA = yaml.Schema.create([
  // NOTE: Type order matters!
  // Inherited classes must precede their parents because the dumper
  // doesn't inspect class inheritance and just picks first suitable
  // class from this array.
  new yaml.Type('!tag3', {
    loadKind: 'mapping',
    loadValidate: function (data) {
      if (null === data) {
        return false;
      }
      if (!Object.prototype.hasOwnProperty.call(data, '=') &&
          !Object.prototype.hasOwnProperty.call(data, 'x')) {
        return false;
      }
      if (!Object.keys(data).every(function (k) { return '=' === k || 'x' === k || 'y' === k || 'z' === k; })) {
        return false;
      }
      return true;
    },
    loadCreate: function (data) {
      return new Tag3({ x: (data['='] || data.x), y: data.y, z: data.z });
    },
    dumpInstanceOf: Tag3,
    dumpRepresent: function (object) {
      return { '=': object.x, y: object.y, z: object.z };
    }
  }),
  new yaml.Type('!tag2', {
    loadKind: 'scalar',
    loadCreate: function (data) {
      return new Tag2({ x: ('number' === typeof data) ? data : parseInt(data, 10) });
    },
    dumpInstanceOf: Tag2,
    dumpRepresent: function (object) {
      return String(object.x);
    }
  }),
  new yaml.Type('!tag1', {
    loadKind: 'mapping',
    loadValidate: function (data) {
      if (null === data) {
        return false;
      }
      if (!Object.prototype.hasOwnProperty.call(data, 'x')) {
        return false;
      }
      if (!Object.keys(data).every(function (k) { return 'x' === k || 'y' === k || 'z' === k; })) {
        return false;
      }
      return true;
    },
    loadCreate: function (data) {
      return new Tag1({ x: data.x, y: data.y, z: data.z });
    },
    dumpInstanceOf: Tag1
  }),
  new yaml.Type('!foo', {
    loadKind: 'mapping',
    loadValidate: function (data) {
      if (null === data) {
        return false;
      }
      if (!Object.keys(data).every(function (k) { return 'my-parameter' === k || 'my-another-parameter' === k; })) {
        return false;
      }
      return true;
    },
    loadCreate: function (data) {
      return new Foo({
        myParameter:        data['my-parameter'],
        myAnotherParameter: data['my-another-parameter']
      });
    },
    dumpInstanceOf: Foo,
    dumpRepresent: function (object) {
      return {
        'my-parameter':         object.myParameter,
        'my-another-parameter': object.myAnotherParameter
      };
    }
  })
]);

exports.Tag1 = Tag1;
exports.Tag2 = Tag2;
exports.Tag3 = Tag3;
exports.Foo = Foo;
exports.TEST_SCHEMA = TEST_SCHEMA;
