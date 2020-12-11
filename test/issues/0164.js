'use strict';


const assert = require('assert');
const yaml = require('../../');


it('should define __proto__ as a value (not invoke setter)', function () {
  let object = yaml.load('{ __proto__: {foo: bar} }');

  assert.strictEqual(({}).hasOwnProperty.call(yaml.load('{}'), '__proto__'), false);
  assert.strictEqual(({}).hasOwnProperty.call(object, '__proto__'), true);
  assert(!object.foo);
});
