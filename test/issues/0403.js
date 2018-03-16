'use strict';


var assert = require('assert');
var yaml = require('../../');


test('should properly dump leading newlines and spaces', function () {
  var dump, src;

  src = { str: '\n  a\nb' };
  dump = yaml.dump(src);
  assert.deepEqual(yaml.safeLoad(dump), src);

  src = { str: '\n\n  a\nb' };
  dump = yaml.dump(src);
  assert.deepEqual(yaml.safeLoad(dump), src);

  src = { str: '\n  a\nb' };
  dump = yaml.dump(src, { indent: 10 });
  assert.deepEqual(yaml.safeLoad(dump), src);
});
