JS.require('JS.Class');
JS.require('JS.Hash');


exports.Generator = new JS.Class('Generator', {
  initialize: function (fn) {
    this.fn = fn;
  },

  next: function (callback) {
    callback(this.fn());
  },

  forEach: function (callback) {
    var self = this,
        walk = function () {
          self.next(function (data) {
            if (!!data) {
              callback(data);
              walk();
            }
          });
        };

    walk();
  }
});


exports.Hashable = new JS.Class('Hashable', {
  hash: function () {
    var values = [], self = this;
    
    Object.getOwnPropertyNames(this).forEach(function (key) {
      values.push(key + ':' + self[key]);
    });

    return this.klass + '(' + values.join(', ') + ')';
  }
});

// Make sure Hash wll be "Hashable"
JS.Hash.include(exports.Hashable);
JS.Hash.include({
  dup: function () {
    var copy = new JS.Hash(this._default);
    // TODO: More effecient clone algorithm?
    this.forEachPair(function (key, val) { copy.store(key, val); });
    return copy;
  }
});
JS.Hash.alias({clone: 'dup'});


var None = new JS.Class('None', { hash: function () { return 'None'; }  });
None.include(exports.Hashable);


// singleton
exports.None = new None();


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
