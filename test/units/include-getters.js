'use strict';

var assert = require('assert');
var yaml = require('../../');

describe('includeGetters', function () {
  it('should serialize inherited getter-backed properties only when includeGetters is true', function () {
    var accessLog = [];

    function Entity(id, content) {
      Object.defineProperty(this, '_id', {
        value: id,
        enumerable: false,
        writable: true,
        configurable: true
      });

      Object.defineProperty(this, '_content', {
        value: content,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }

    Object.defineProperty(Entity.prototype, 'id', {
      configurable: true,
      enumerable: false,
      get: function () {
        accessLog.push('id');
        return this._id;
      }
    });

    Object.defineProperty(Entity.prototype, 'content', {
      configurable: true,
      enumerable: false,
      get: function () {
        accessLog.push('content');
        return this._content;
      }
    });

    Object.defineProperty(Entity.prototype, 'writeOnly', {
      configurable: true,
      enumerable: false,
      get: undefined,
      set: function () {}
    });

    Entity.prototype.method = function () {
      return 'ignored';
    };

    var entity = new Entity(123, 'hello');

    assert.deepStrictEqual(Object.keys(entity), []);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(entity, 'id'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(entity, 'content'), false);

    assert.strictEqual(yaml.dump(entity, { noRefs: true }), '{}\n');
    assert.strictEqual(yaml.dump(entity, { includeGetters: false, noRefs: true }), '{}\n');

    accessLog = [];

    assert.strictEqual(
      yaml.dump(entity, { includeGetters: true, noRefs: true }),
      'id: 123\ncontent: hello\n'
    );

    assert.deepStrictEqual(accessLog, [ 'id', 'content' ]);
    assert.deepStrictEqual(Object.keys(entity), []);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(entity, 'id'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(entity, 'content'), false);
  });
});
