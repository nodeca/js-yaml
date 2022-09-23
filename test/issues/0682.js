'use strict';

const assert = require('assert');
const fs     = require('fs');
const yaml   = require('../..');


it('Should serialize strings with tabs as blocks', function () {
  const expected = fs.readFileSync(require('path').join(__dirname, '/0682-1.yml'), 'utf8');
  const result = yaml.dump({ value: 'a\n\tb' });
  assert.strictEqual(expected, result);
});

it('Should serialize strings with tabs and carriage returns as blocks and deserialize them', function () {
  const data = {
    value: '\r\n    \tsome text\r\n  more text but less indented \r\neven less indentation'
  };
  const result = yaml.dump(data);
  const loaded = yaml.load(result);
  assert.deepEqual(data, loaded);
});

it('Should serialize strings where the initial whitespace is less than the following', function () {
  const data = {
    value: '    \nsome text\n less indented text\n',
    other: '    some text\nless indented text\n'
  };
  const result = yaml.dump(data);
  const loaded = yaml.load(result);
  assert.deepEqual(data, loaded);
  const expected = fs.readFileSync(require('path').join(__dirname, '/0682-2.yml'), 'utf8');
  assert.strictEqual(expected, result);
});
