'use strict';


var assert = require('assert');
var yaml   = require('../../');
var readFileSync = require('fs').readFileSync;


describe('Duplicated mapping key errors throw at beginning of key', function () {
  it('on top level', function () {
    var src = readFileSync(require('path').join(__dirname, '/0243-basic.yml'), 'utf8');
    var lines = src.split('\n');

    try {
      yaml.load(src);
    } catch (e) {
      assert.strictEqual(lines[e.mark.line], 'duplicate: # 2');
      assert(e.message.match(/line 10, column 1/), e.message);
    }
  });

  it('inside of mapping values', function () {
    var src = readFileSync(require('path').join(__dirname, '/0243-nested.yml'), 'utf8');
    var lines = src.split('\n');

    try {
      yaml.load(src);
    } catch (e) {
      assert.strictEqual(lines[e.mark.line], '  duplicate: # 2');
      assert(e.message.match(/line 10, column 3/), e.message);
    }
  });

  it('inside flow collection', function () {
    try {
      yaml.load('{ foo: 123, foo: 456 }');
    } catch (e) {
      assert(e.message.match(/line 1, column 13/), e.message);
    }
  });

  it('inside a set', function () {
    try {
      yaml.load('   ? foo\n   ? foo\n   ? bar');
    } catch (e) {
      assert(e.message.match(/line 2, column 5/), e.message);
    }
  });
});
