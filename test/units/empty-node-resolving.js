'use strict';


var assert = require('assert');
var yaml   = require('../../');


suite('Resolving explicit tags on empty nodes', function () {
  test('!!binary', function () {
    assert.throws(function () { yaml.load('!!binary'); }, yaml.YAMLException);
  });

  test('!!bool', function () {
    assert.throws(function () { yaml.load('!!bool'); }, yaml.YAMLException);
  });

  test('!!float', function () {
    assert.throws(function () { yaml.load('!!float'); }, yaml.YAMLException);
  });

  test('!!int', function () {
    assert.throws(function () { yaml.load('!!int'); }, yaml.YAMLException);
  });

  test('!!map', function () {
    assert.deepEqual(yaml.load('!!map'), {});
  });

  test('!!merge', function () {
    assert.doesNotThrow(function () { yaml.load('? !!merge\n: []'); });
  });

  test('!!null', function () {
    // Fetch null from an array to reduce chance that null is returned because of another bug
    assert.strictEqual(yaml.load('- !!null')[0], null);
  });

  test('!!omap', function () {
    assert.deepEqual(yaml.load('!!omap'), []);
  });

  test('!!pairs', function () {
    assert.deepEqual(yaml.load('!!pairs'), []);
  });

  test('!!seq', function () {
    assert.deepEqual(yaml.load('!!seq'), []);
  });

  test('!!set', function () {
    assert.deepEqual(yaml.load('!!set'), {});
  });

  test('!!str', function () {
    assert.strictEqual(yaml.load('!!str'), '');
  });

  test('!!timestamp', function () {
    assert.throws(function () { yaml.load('!!timestamp'); }, yaml.YAMLException);
  });
});
