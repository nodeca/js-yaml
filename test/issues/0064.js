'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


it('Wrong error message when yaml file contains tabs', function () {
  assert.doesNotThrow(
    function () { yaml.load(readFileSync(require('path').join(__dirname, '/0064.yml'), 'utf8')); },
    yaml.YAMLException);
});
