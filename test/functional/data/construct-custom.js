'use strict';

var _classes = require('../../support/classes');

module.exports = [
  new _classes.Tag1({ x: 1 }),
  new _classes.Tag1({ x: 1, y: 2, z: 3 }),
  new _classes.Tag2({ x: 10 }),
  new _classes.Tag3({ x: 1 }),
  new _classes.Tag3({ x: 1, y: 2, z: 3 }),
  new _classes.Tag3({ x: 1, y: 2, z: 3 }),
  new _classes.Foo({ myParameter: 'foo', myAnotherParameter: [1, 2, 3] })
];
