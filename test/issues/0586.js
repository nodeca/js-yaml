'use strict';

/* eslint-disable no-use-before-define, new-cap */


const assert = require('assert');
const yaml   = require('../../');


it('Should allow custom formatting through implicit custom tags', function () {
  function CustomDump(data, opts) {
    if (!(this instanceof CustomDump)) return new CustomDump(data, opts);
    this.data = data;
    this.opts = opts;
  }

  CustomDump.prototype.represent = function () {
    let result = yaml.dump(this.data, Object.assign({ replacer, schema }, this.opts));
    result = result.trim();
    if (result.includes('\n')) result = '\n' + result;
    return result;
  };


  let CustomDumpType = new yaml.Type('!format', {
    kind: 'scalar',
    resolve: () => false,
    instanceOf: CustomDump,
    represent: d => d.represent()
  });


  let schema = yaml.DEFAULT_SCHEMA.extend({ implicit: [ CustomDumpType ] });

  function replacer(key, value) {
    if (key === '') return value; // top-level, don't change this
    if (key === 'flow_choices') return CustomDump(value, { flowLevel: 0 });
    if (key === 'block_choices') return CustomDump(value, { flowLevel: Infinity });
    return value; // default
  }

  let result = CustomDump({ flow_choices : [ 1, 2 ], block_choices: [ 4, 5 ] }).represent().trim();

  assert.strictEqual(result, `
flow_choices: [1, 2]
block_choices:
- 4
- 5`.replace(/^\n/, ''));
});
