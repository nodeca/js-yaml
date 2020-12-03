'use strict';


var assert = require('assert');
var yaml   = require('../../');


function SuccessSignal() {}

var TestClassYaml = new yaml.Type('!test', {
  kind: 'scalar',
  resolve: function () { throw new SuccessSignal(); }
});

var TEST_SCHEMA = yaml.DEFAULT_SCHEMA.extend([ TestClassYaml ]);


it('Resolving of empty nodes are skipped in some cases', function () {
  assert.throws(function () { yaml.load('- foo: !test\n- bar: baz', { schema: TEST_SCHEMA }); }, SuccessSignal);
});
