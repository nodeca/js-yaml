JS.require('JS.Class');
JS.require('JS.Hash');


var __ = require('./import')('error');


var ResolverError = exports.ResolverError = new JS.Class('ResolverError', __.YAMLError, {});


exports.BaseResolver = new JS.Class('BaseResolver', {
  extend: {
    yamlImplicitResolvers: new JS.Hash(),
    yamlPathResolvers: new JS.Hash(),

    addImplicitResolver: function (tag, regexp, first) {
      var cls = this;

      if (undefined === first) {
        first = [null];
      }

      first.forEach(function (ch) {
        cls.yamlImplicitResolvers.setDefault(ch, []).append(tag, regexp);
      });
    }
  },

  initialize: function () {
    this.resolverExactPaths = [];
    this.resolverPrefixPaths = [];
  },

  descendResolver: function (currentNode, currentIndex) {
    var exact_paths, prefix_paths;

    if (!this.klass.yamlPathResolvers) {
      return;
    }

    exact_paths = {};
    prefix_paths = [];

    if (currentNode) {}
  }
});


exports.Resolver = new JS.Class('Resolver', exports.BaseResolver, {
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
