'use strict';

var assert = require('assert');
var yaml = require('../../');


describe('Float out-of-range fix', function () {

  it('should reject values that would parse to Infinity', function () {
    // These values would serialize to Infinity after round-trip
    assert.strictEqual(yaml.load('61e9540'), '61e9540');
    assert.strictEqual(yaml.load('1e309'), '1e309');
    assert.strictEqual(yaml.load('-1e309'), '-1e309');
  });

  it('should still allow explicit infinity/NaN', function () {
    assert.strictEqual(yaml.load('.inf'), Infinity);
    assert.strictEqual(yaml.load('+.inf'), Infinity);
    assert.strictEqual(yaml.load('-.inf'), -Infinity);
    assert.strictEqual(yaml.load('.nan'), NaN);
  });

  it('should allow normal floats', function () {
    assert.strictEqual(yaml.load('1.5'), 1.5);
    assert.strictEqual(yaml.load('1e5'), 100000);
    assert.strictEqual(yaml.load('-2.5e-3'), -0.0025);
    assert.strictEqual(yaml.load('+.inf'), Infinity);
  });

  it('should allow floats with underscores', function () {
    assert.strictEqual(yaml.load('1_000.5'), 1000.5);
  });

});