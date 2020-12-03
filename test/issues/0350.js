'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('should return parse docs from loadAll', function () {
  var data = yaml.loadAll(readFileSync(require('path').join(__dirname, '/0350.yml'), 'utf8'));

  assert.deepStrictEqual(data, [ { a: 1 }, { b: 2 } ]);
});
