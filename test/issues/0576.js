'use strict';


const assert = require('assert');
const yaml   = require('../../');


describe('Custom tags', function () {
  let tag_names = [ 'tag', '!tag', '!!tag', '!<!tag>', 'tag*-!< >{\n}', '!tagαβγ' ];
  let encoded   = [ '!<tag>', '!tag', '!%21tag', '!%3C%21tag%3E',
    '!<tag*-%21%3C%20%3E%7B%0A%7D>', '!tag%CE%B1%CE%B2%CE%B3' ];

  let tags = tag_names.map(tag =>
    new yaml.Type(tag, {
      kind: 'scalar',
      resolve: () => true,
      construct: object => [ tag, object ],
      predicate: object => object.tag === tag,
      represent: () => 'value'
    })
  );

  let schema = yaml.DEFAULT_SCHEMA.extend(tags);


  it('Should dump tags with proper encoding', function () {
    tag_names.forEach(function (tag, idx) {
      assert.strictEqual(yaml.dump({ tag }, { schema }), encoded[idx] + ' value\n');
    });
  });


  it('Should decode tags when loading', function () {
    encoded.forEach(function (tag, idx) {
      assert.deepStrictEqual(yaml.load(tag + ' value', { schema }), [ tag_names[idx], 'value' ]);
    });
  });


  it('Should url-decode built-in tags', function () {
    assert.strictEqual(yaml.load('!!%69nt 123'), 123);
    assert.strictEqual(yaml.load('!!%73tr 123'), '123');
  });


  it('Should url-decode %TAG prefix', function () {
    assert.deepStrictEqual(yaml.load(`
%TAG !xx! %74a
---
!xx!g 123
`, { schema }), [ 'tag', '123' ]);
  });
});
