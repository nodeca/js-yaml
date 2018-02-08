'use strict';

var assert = require('assert');
var fc     = require('fast-check');
var yaml   = require('../');

// Generate valid YAML instances for yaml.safeDump
var key = fc.string16bits();
var values = [
  key, fc.boolean(), fc.integer(), fc.double(),
  fc.constantFrom(null, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
];
var yamlArbitrary = fc.object({ key: key, values: values });

// Generate valid options for yaml.safeDump configuration
var dumpOptionsArbitrary = fc.record({
  skipInvalid: fc.boolean(),
  sortKeys: fc.boolean(),
  noRefs: fc.boolean(),
  noCompatMode: fc.boolean(),
  condenseFlow: fc.boolean(),
  indent: fc.integer(1, 80),
  flowLevel: fc.integer(-1, 10),
  styles: fc.record({
    '!!null': fc.constantFrom('lowercase', 'canonical', 'uppercase', 'camelcase'),
    '!!int': fc.constantFrom('decimal', 'binary', 'octal', 'hexadecimal'),
    '!!bool': fc.constantFrom('lowercase', 'uppercase', 'camelcase'),
    '!!float': fc.constantFrom('lowercase', 'uppercase', 'camelcase')
  }, { with_deleted_keys: true })
}, { with_deleted_keys: true })
  .map(function (instance) {
    if (instance.condenseFlow === true && instance.flowLevel !== undefined) { instance.flowLevel = -1; }
    return instance;
  });

suite('Properties', function () {
  test('Load from dumped should be the original object', function () {
    fc.assert(fc.property(
      yamlArbitrary,
      dumpOptionsArbitrary,
      function (obj, dumpOptions) {
        var yamlContent = yaml.safeDump(obj, dumpOptions);
        assert.ok(typeof yamlContent === 'string');
        assert.deepStrictEqual(yaml.safeLoad(yamlContent), obj);
      }));
  });
});
