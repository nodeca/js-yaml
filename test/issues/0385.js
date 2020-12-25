'use strict';


const assert = require('assert');
const yaml = require('../../');


describe('Multi tag', function () {
  it('should process multi tags', function () {
    let tags = [ 'scalar', 'mapping', 'sequence' ].map(kind =>
      new yaml.Type('!', {
        kind,
        multi: true,
        resolve: function () {
          return true;
        },
        construct: function (value, tag) {
          return { kind, tag, value };
        }
      })
    );

    let schema = yaml.DEFAULT_SCHEMA.extend(tags);

    let expected = [
      {
        kind: 'scalar',
        tag: '!t1',
        value: '123'
      },
      {
        kind: 'sequence',
        tag: '!t2',
        value: [ 1, 2, 3 ]
      },
      {
        kind: 'mapping',
        tag: '!t3',
        value: { a: 1, b: 2 }
      }
    ];

    assert.deepStrictEqual(yaml.load(`
- !t1 123
- !t2 [ 1, 2, 3 ]
- !t3 { a: 1, b: 2 }
`, {
      schema: schema
    }), expected);
  });


  it('should process tags depending on prefix', function () {
    let tags = [ '!foo', '!bar', '!' ].map(prefix =>
      new yaml.Type(prefix, {
        kind: 'scalar',
        multi: true,
        resolve: function () {
          return true;
        },
        construct: function (value, tag) {
          return { prefix, tag, value };
        }
      })
    );

    tags.push(
      new yaml.Type('!bar', {
        kind: 'scalar',
        resolve: function () {
          return true;
        },
        construct: function (value) {
          return { single: true, value };
        }
      })
    );

    let schema = yaml.DEFAULT_SCHEMA.extend(tags);

    let expected = [
      { prefix: '!foo', tag: '!foo', value: '1' },
      { prefix: '!foo', tag: '!foo2', value: '2' },
      { single: true, value: '3' },
      { prefix: '!bar', tag: '!bar2', value: '4' },
      { prefix: '!', tag: '!baz', value: '5' }
    ];

    assert.deepStrictEqual(yaml.load(`
- !foo 1
- !foo2 2
- !bar 3
- !bar2 4
- !baz 5
`, {
      schema: schema
    }), expected);
  });


  it('should dump multi types with custom tag', function () {
    let tags = [
      new yaml.Type('!', {
        kind: 'scalar',
        multi: true,
        predicate: function (obj) {
          return !!obj.tag;
        },
        representName: function (obj) {
          return obj.tag;
        },
        represent: function (obj) {
          return obj.value;
        }
      })
    ];

    let schema = yaml.DEFAULT_SCHEMA.extend(tags);

    assert.strictEqual(yaml.dump({ test: { tag: 'foo', value: 'bar' } }, {
      schema: schema
    }), 'test: !<foo> bar\n');
  });
});
