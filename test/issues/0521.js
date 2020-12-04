'use strict';


var assert = require('assert');
var yaml = require('../../');


it('Don\'t quote strings with # without need', function () {
  var data = yaml.load(`
http://example.com/page#anchor: no#quotes#required
parameter#fallback: 'quotes #required'
'foo #bar': key is quoted
`);

  var sample = {
    'http://example.com/page#anchor': 'no#quotes#required',
    'parameter#fallback': 'quotes #required',
    'foo #bar': 'key is quoted'
  };

  assert.deepStrictEqual(
    yaml.dump(sample),
    yaml.dump(data)
  );

});
