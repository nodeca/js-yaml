'use strict';

const assert = require('assert');
const fs     = require('fs');
const yaml   = require('../..');


it('Should serialize strings with tabs as blocks', function () {
  const expected = fs.readFileSync(require('path').join(__dirname, '/0682.yml'), 'utf8');
  const result = yaml.dump({ value: 'a\n\tb' });
  assert.strictEqual(expected, result);
});
