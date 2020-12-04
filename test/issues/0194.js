'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Don\'t throw on warning', function () {
  var src = `
foo: {
    bar: true
}
`;
  var warnings = [],
      data;

  data = yaml.load(src);

  assert.deepStrictEqual(data, { foo: { bar: true } });

  yaml.load(src, { onWarning: function (e) { warnings.push(e); } });

  assert.strictEqual(warnings.length, 1);
});
