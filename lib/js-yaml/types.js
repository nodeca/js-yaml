JS.require('JS.Class');
JS.require('JS.Hash');


exports.Generator = new JS.Class('Generator', {
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


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
