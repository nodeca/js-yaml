'use strict';


var JS = global.JS,
    exports = module.exports = {};


JS.require('JS.Class');
JS.require('JS.Hash');


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


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
