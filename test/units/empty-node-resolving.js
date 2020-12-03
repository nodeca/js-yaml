'use strict';


var assert = require('assert');
var yaml   = require('../../');


describe('Resolving explicit tags on empty nodes', function () {
  it('!!binary', function () {
    assert.throws(function () { yaml.load('!!binary'); }, yaml.YAMLException);
  });

  it('!!bool', function () {
    assert.throws(function () { yaml.load('!!bool'); }, yaml.YAMLException);
  });

  it('!!float', function () {
    assert.throws(function () { yaml.load('!!float'); }, yaml.YAMLException);
  });

  it('!!int', function () {
    assert.throws(function () { yaml.load('!!int'); }, yaml.YAMLException);
  });

  it('!!map', function () {
    assert.deepStrictEqual(yaml.load('!!map'), {});
  });

  it('!!merge', function () {
    assert.doesNotThrow(function () { yaml.load('? !!merge\n: []'); });
  });

  it('!!null', function () {
    // Fetch null from an array to reduce chance that null is returned because of another bug
    assert.strictEqual(yaml.load('- !!null')[0], null);
  });

  it('!!omap', function () {
    assert.deepStrictEqual(yaml.load('!!omap'), []);
  });

  it('!!pairs', function () {
    assert.deepStrictEqual(yaml.load('!!pairs'), []);
  });

  it('!!seq', function () {
    assert.deepStrictEqual(yaml.load('!!seq'), []);
  });

  it('!!set', function () {
    assert.deepStrictEqual(yaml.load('!!set'), {});
  });

  it('!!str', function () {
    assert.strictEqual(yaml.load('!!str'), '');
  });

  it('!!timestamp', function () {
    assert.throws(function () { yaml.load('!!timestamp'); }, yaml.YAMLException);
  });
});
