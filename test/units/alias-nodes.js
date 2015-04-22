'use strict';


var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


function TestClass(data) {
  var self = this;
  Object.keys(data).forEach(function (key) { self[key] = data[key]; });
}

var TestClassYaml = new yaml.Type('!test', {
  kind: 'mapping',
  construct: function (data) { return new TestClass(data); }
});

var TEST_SCHEMA = yaml.Schema.create([ TestClassYaml ]);


suite('Alias nodes', function () {
  suite('Resolving of an alias node should result the resolved and contructed value of the anchored node', function () {
    test('Simple built-in primitives', function () {
      assert.strictEqual(yaml.load('[&1 "foobar", *1]')[1], 'foobar');
      assert.strictEqual(yaml.load('[&1 ~, *1]')[1], null);
      assert.strictEqual(yaml.load('[&1 true, *1]')[1], true);
      assert.strictEqual(yaml.load('[&1 42, *1]')[1], 42);
    });

    test('Simple built-in objects', function () {
      assert.deepEqual(yaml.load('[&1 [a, b, c, d], *1]')[1], [ 'a', 'b', 'c', 'd' ]);
      assert.deepEqual(yaml.load('[&1 {a: b, c: d}, *1]')[1], { a: 'b', c: 'd' });
    });

    test('Recursive built-in objects', function () {
      var actual = yaml.load('[&1 {self: *1}, *1]')[1];

      assert(actual === actual.self);
    });

    test("JavaScript-specific objects (JS-YAML's own extension)", function () {
      var actual = yaml.load('[&1 !!js/function "function sum(a, b) { return a + b }", *1]')[1];

      assert.strictEqual(Object.prototype.toString.call(actual), '[object Function]');
      assert.strictEqual(actual(10, 5), 15);
    });

    test('Simple custom objects', function () {
      var expected = new TestClass({ a: 'b', c: 'd' }),
          actual = yaml.load('[&1 !test {a: b, c: d}, *1]', { schema: TEST_SCHEMA })[1];

      assert(actual instanceof TestClass);
      assert.deepEqual(actual, expected);
    });

    // TODO: Not implemented yet (see issue #141)
    test.skip('Recursive custom objects', function () {
      var actual = yaml.load('[&1 !test {self: *1}, *1]', { schema: TEST_SCHEMA })[1];

      assert(actual instanceof TestClass);
      assert(actual.self instanceof TestClass);
      assert(actual === actual.self);
    });
  });
});
