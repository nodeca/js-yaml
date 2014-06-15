'use strict';

var schema = require('../../support/schema');

module.exports = [
  new schema.Tag1({ x: 1 }),
  new schema.Tag1({ x: 1, y: 2, z: 3 }),
  new schema.Tag2({ x: 10 }),
  new schema.Tag3({ x: 1 }),
  new schema.Tag3({ x: 1, y: 2, z: 3 }),
  new schema.Tag3({ x: 1, y: 2, z: 3 }),
  new schema.Foo({ myParameter: 'foo', myAnotherParameter: [1, 2, 3] })
];
