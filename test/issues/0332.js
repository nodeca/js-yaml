'use strict';


const assert = require('assert');
const yaml   = require('../../');


it('Should format errors', function () {
  try {
    yaml.load('"foo\u0001bar"');
  } catch (err) {
    assert.strictEqual(err.toString(true), 'YAMLException: expected valid JSON character (1:9)');
    assert.strictEqual(err.toString(false), `YAMLException: expected valid JSON character (1:9)

 1 | "foo\u0001bar"
-------------^`);
  }
});
