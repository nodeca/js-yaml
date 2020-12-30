'use strict';


const assert = require('assert');
const yaml = require('../../');


it('should throw when tabs are used as indentation', function () {
  assert.throws(() => yaml.load(`
 \tfoo: 1
 bar: 2
`), /end of the stream or a document separator is expected/);

  assert.throws(() => yaml.load(`
 foo: 1
 \tbar: 2
`), /tab characters must not be used/);

  assert.throws(() => yaml.load(`
 \t- foo
 - bar
`), /end of the stream or a document separator is expected/);

  assert.throws(() => yaml.load(`
 - foo
 \t- bar
`), /tab characters must not be used/);
});


it('should allow tabs inside separation spaces', function () {
  assert.deepStrictEqual(yaml.load(`
 foo\t \t:\t \t1\t \t
\t \t \t
 bar \t : \t 2 \t
`), { foo: 1, bar: 2 });

  assert.deepStrictEqual(yaml.load(`
 -\t \tfoo\t \t
\t \t \t
 - \t bar \t 
`), [ 'foo', 'bar' ]);

  assert.deepStrictEqual(yaml.load(`
\t{\tfoo\t:\t1\t,\tbar\t:\t2\t}\t
`), { foo: 1, bar: 2 });

  assert.deepStrictEqual(yaml.load(`
\t[\tfoo\t,\tbar\t]\t
`), [ 'foo', 'bar' ]);

  assert.deepStrictEqual(yaml.load(`
foo: # string indent = 1
 \t \t1
  \t 2
 \t \t3
`), { foo: '1 2 3' });
});


it('should throw when tabs are used as indentation in strings', function () {
  assert.throws(() => yaml.load(`
foo:
  bar: |
  \tbaz
`), /tab characters must not be used/);

  assert.deepStrictEqual(yaml.load(`
foo:
  bar: |
   \tbaz
`), { foo: { bar: '\tbaz\n' } });
});
