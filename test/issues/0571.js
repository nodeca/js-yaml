'use strict';


const assert = require('assert');
const yaml   = require('../../');


describe('Undefined', function () {
  let undef = new yaml.Type('!undefined', {
    kind: 'scalar',
    resolve: () => true,
    construct: () => {},
    predicate: object => typeof object === 'undefined',
    represent: () => ''
  });

  let undef_schema = yaml.DEFAULT_SCHEMA.extend(undef);


  it('Should replace undefined with null in collections', function () {
    let str;

    str = yaml.dump([ undefined, 1, undefined, null, 2 ], { flowLevel: 0 });
    assert(str.match(/^\[/));
    assert.deepStrictEqual(
      yaml.load(str),
      [ null, 1, null, null, 2 ]
    );

    str = yaml.dump([ undefined, 1, undefined, null, 2 ], { flowLevel: -1 });
    assert(str.match(/^- /));
    assert.deepStrictEqual(
      yaml.load(str),
      [ null, 1, null, null, 2 ]
    );
  });


  it('Should remove keys with undefined in mappings', function () {
    let str;

    str = yaml.dump({ t: undefined, foo: 1, bar: undefined, baz: null }, { flowLevel: 0 });
    assert(str.match(/^\{/));
    assert.deepStrictEqual(
      yaml.load(str),
      { foo: 1, baz: null }
    );

    str = yaml.dump({ t: undefined, foo: 1, bar: undefined, baz: null }, { flowLevel: -1 });
    assert(str.match(/^foo:/));
    assert.deepStrictEqual(
      yaml.load(str),
      { foo: 1, baz: null }
    );
  });


  it("Should serialize top-level undefined to ''", function () {
    assert.strictEqual(yaml.dump(undefined), '');
  });


  it('Should serialize undefined if schema is available', function () {
    assert.deepStrictEqual(
      yaml.load(
        yaml.dump([ 1, undefined, null, 2 ], { schema: undef_schema }),
        { schema: undef_schema }
      ),
      [ 1, undefined, null, 2 ]
    );

    assert.deepStrictEqual(
      yaml.load(
        yaml.dump({ foo: 1, bar: undefined, baz: null }, { schema: undef_schema }),
        { schema: undef_schema }
      ),
      { foo: 1, bar: undefined, baz: null }
    );
  });


  it('Should respect null formatting', function () {
    assert.strictEqual(
      yaml.dump([ undefined ], { styles: { '!!null': 'uppercase' } }),
      '- NULL\n'
    );
  });


  it('Should return an error if neither null nor undefined schemas are available', function () {
    assert.throws(() => {
      yaml.dump([ 'foo', undefined, 'bar' ], { schema: yaml.FAILSAFE_SCHEMA });
    }, /unacceptable kind of an object to dump/);
  });


  it('Should skip leading values correctly', function () {
    assert.strictEqual(
      yaml.dump([ () => {}, 'a' ], { flowLevel: 0, skipInvalid: true }),
      '[a]\n');

    assert.strictEqual(
      yaml.dump([ () => {}, 'a' ], { flowLevel: -1, skipInvalid: true }),
      '- a\n');

    assert.strictEqual(
      yaml.dump({ a: () => {}, b: 'a' }, { flowLevel: 0, skipInvalid: true }),
      '{b: a}\n');

    assert.strictEqual(
      yaml.dump({ a: () => {}, b: 'a' }, { flowLevel: -1, skipInvalid: true }),
      'b: a\n');
  });
});
