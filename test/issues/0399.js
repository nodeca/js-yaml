'use strict';


var assert = require('assert');
var yaml = require('../../');


it('should properly dump negative ints in different styles', function () {
  var dump, src = { integer: -100 };

  dump = yaml.dump(src, { styles: { '!!int': 'binary' } });
  assert.deepStrictEqual(yaml.load(dump), src);

  dump = yaml.dump(src, { styles: { '!!int': 'octal' } });
  assert.deepStrictEqual(yaml.load(dump), src);

  dump = yaml.dump(src, { styles: { '!!int': 'hex' } });
  assert.deepStrictEqual(yaml.load(dump), src);
});
