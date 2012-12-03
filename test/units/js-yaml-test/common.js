'use strict';


var assert = require('assert');
var $$$ = require('../../../lib/js-yaml-test/common');


describe('Common.', function () {
  describe('#areEqual()', function () {
    var test = $$$.areEqual;

    it('should return false when the passed objects are of different types', function () {
      assert(!test(42, 'answer'));
      assert(!test(false, null));
    });

    it('should return true when both of the passed objects are NaN', function () {
      assert(test(NaN, NaN));
      assert(!test(NaN, 42));
      assert(!test(null, NaN));
    });

    it('should treat numbers', function () {
      assert(test(-346, -346));
      assert(test(0, 0));
      assert(test(2376, 2376));
      assert(test(-672.234, -672.234));
      assert(test(9.358546212888048e-14, 9.358546212888048e-14));
      assert(!test(5, -5));
      assert(!test(8234, 7823));
      assert(!test(-564.23466, 0.236852109));
      assert(!test(9.358546212888048e-14, 9.358546212888047e-14));
    });

    it('should treat strings', function () {
      assert(test('hello world', 'hello world'));
      assert(!test('john', 'joe'));
    });

    it('should treat flat arrays', function () {
      assert(test([1, 2, 3, 4], [1, 2, 3, 4]));
      assert(!test([2, 1, 4], [1, 2, 4]));
    });

    it('should treat nested arrays', function () {
      assert(test([5, 6, [9, 3], 7], [5, 6, [9, 3], 7]));
      assert(!test([7, 7, [3, 8, 1], 1], [7, 7, [], 1]));
    });

    it('should treat flat hash-like objects', function () {
      var object = {
        x: 12,
        y: 34,
        z: -3
      };

      assert(test(object, { x: 12, y: 34, z: -3 }));
      assert(test(object, { z: -3, x: 12, y: 34 }));
      assert(!test(object, { x: 12, y: 34, z: -3, trash: 0 }));
      assert(!test(object, { x: 12, y: 34 }));
    });

    it('should treat nested hash-like objects', function () {
      var object = {
        foo: 'hello',
        bar: {
          baz: 42
        }
      };

      assert(test(object, { bar: { baz: 42 }, foo: 'hello' }));
      assert(!test(object, { foo: 'hello' }));
      assert(!test(object, { bar: { baz: 42 } }));      
      assert(!test(object, { bar: { baz: null }, foo: 'hello' }));
    });

    it('should treat constructed objects', function () {
      function Foo(x, y) {
        this.x = x;
        this.y = y;
      }

      function Bar(text) {
        this.text = text;
      }

      function Baz() {
        Bar.apply(this, arguments);
      }
      $$$.inherits(Baz, Bar);

      assert(test(new Foo(1, 2), new Foo(1, 2)));
      assert(!test(new Foo(1, 2), new Foo(1, 4)));
      assert(test(new Bar('hello'), new Bar('hello')))
      assert(!test(new Bar('snow'), new Bar('stone')))
      assert(!test(new Bar('world'), new Baz('world')))
    });
  });
});
