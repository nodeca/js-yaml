'use strict';


var assert = require('assert');
var yaml = require('../../');


test('should properly dump negative ints in different styles', function () {
  var dump, src = { integer: -100 };

  dump = yaml.dump(src, { styles: { '!!int': 'binary' } });
  assert.deepEqual(yaml.safeLoad(dump), src);

  dump = yaml.dump(src, { styles: { '!!int': 'octal' } });
  assert.deepEqual(yaml.safeLoad(dump), src);

  dump = yaml.dump(src, { styles: { '!!int': 'hex' } });
  assert.deepEqual(yaml.safeLoad(dump), src);
});
