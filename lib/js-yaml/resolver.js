JS.require('JS.Class');
JS.require('JS.Hash');


var __ = require('./import')('nodes');


var DEFAULT_SCALAR_TAG = 'tag:yaml.org,2002:str',
    DEFAULT_SEQUENCE_TAG = 'tag:yaml.org,2002:seq',
    DEFAULT_MAPPING_TAG = 'tag:yaml.org,2002:map';


exports.BaseResolver = new JS.Class('BaseResolver', {
  extend: {
    yamlImplicitResolvers: new JS.Hash(),
    addImplicitResolver: function (tag, regexp, first) {
      var cls = this;

      if (undefined === first) {
        first = [null];
      }

      first.forEach(function (ch) {
        cls.yamlImplicitResolvers.setDefault(ch, [[tag, regexp]]);
      });
    },
  },

  initialize: function () {
    this.resolverExactPaths = [];
    this.resolverPrefixPaths = [];
  },

  descendResolver: function (currentNode, currentIndex) {
    // not implemented due to experimental nature of method
    return;
  },

  ascendResolver: function () {
    // not implemented due to experimental nature of method
    return;
  },

  resolve: function (kind, value, implicit) {
    var resolvers, i, tag, regexp;

    if (kind.isA(__.ScalarNode) && implicit[0]) {
      if (value == '') {
        resolvers = this.klass.yamlImplicitResolvers.get('', []);
      } else {
        resolvers = this.klass.yamlImplicitResolvers.get(value[0], []);
      }

      resolvers.push(this.klass.yamlImplicitResolvers.get(null, []));

      for (i in resolvers) {
        tag = resolvers[i][0];
        regexp = resolvers[i][1];
        if (regexp.test(value)) {
          return tag;
        }
      }

      implicit = implicit[1];
    }

    if (kind.isA(__.ScalarNode)) {
      return DEFAULT_SCALAR_TAG;
    } else if (kind.isA(__.SequenceNode)) {
      return DEFAULT_SEQUENCE_TAG;
    } else if (kind.isA(__.MappingNode)) {
      return DEFAULT_MAPPING_TAG;
    }
  }
});


exports.Resolver = new JS.Class('Resolver', exports.BaseResolver, {
  extend: {
    yamlImplicitResolvers: exports.BaseResolver.yamlImplicitResolvers.dup()
  }
});

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:bool',
  new RegExp('^(?:yes|Yes|YES|no|No|NO' +
             '|true|True|TRUE|false|False|FALSE' +
             '|on|On|ON|off|Off|OFF)$'),
  ['y', 'Y', 'n', 'N', 't', 'T', 'f', 'F', 'o', 'O']);

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:float',
  new RegExp('^(?:[-+]?(?:[0-9][0-9_]*)\.[0-9_]*(?:[eE][-+][0-9]+)?' +
             '|\.[0-9_]+(?:[eE][-+][0-9]+)?' +
             '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*' +
             '|[-+]?\.(?:inf|Inf|INF)' +
             '|\.(?:nan|NaN|NAN))$'),
  ['-', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.']);

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:int',
  new RegExp('^(?:[-+]?0b[0-1_]+' +
             '|[-+]?0[0-7_]+' +
             '|[-+]?(?:0|[1-9][0-9_]*)' +
             '|[-+]?0x[0-9a-fA-F_]+' +
             '|[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$'),
  ['-', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:merge',
  new RegExp('^(?:<<)$'),
  ['<']);

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:null',
  new RegExp('^(?: ~' +
             '|null|Null|NULL' +
             '| )$'),
  ['~', 'n', 'N', '']);

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:timestamp',
  new RegExp('^(?:[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' +
             '|[0-9][0-9][0-9][0-9] -[0-9][0-9]? -[0-9][0-9]?' +
             '(?:[Tt]|[ \t]+)[0-9][0-9]?' +
             ':[0-9][0-9] :[0-9][0-9] (?:\.[0-9]*)?' +
             '(?:[ \t]*(?:Z|[-+][0-9][0-9]?(?::[0-9][0-9])?))?)$'),
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

exports.Resolver.addImplicitResolver('tag:yaml.org,2002:value',
  new RegExp('^(?:=)$'),
  ['=']);

// The following resolver is only for documentation purposes. It cannot work
// because plain scalars cannot start with '!', '&', or '*'.
exports.Resolver.addImplicitResolver('tag:yaml.org,2002:yaml',
  new RegExp('^(?:!|&|\*)$'),
  ['!', '&', '*']);


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
