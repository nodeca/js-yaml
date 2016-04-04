'use strict';


var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Don\'t throw on warning', function () {
  var src = readFileSync(require('path').join(__dirname, '/0194.yml'), 'utf8'),
      warnings = [],
      data;

  data = yaml.safeLoad(src);

  assert.deepEqual(data, { foo: { bar: true } });

  yaml.safeLoad(src, { onWarning: function (e) { warnings.push(e); } });

  assert.strictEqual(warnings.length, 1);
});
