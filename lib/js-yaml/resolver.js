JS.require('JS.Class');
JS.require('JS.Hash');


var __ = require('./import')('error');


var ResolverError = exports.ResolverError = new JS.Class('ResolverError', __.YAMLError, {});


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
        cls.yamlImplicitResolvers.setDefault(ch, []).append(tag, regexp);
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

  checkResolverPrefix: function (depth, path, kind, currentNode, currentIndex) {
    /* TBI
    node_check, index_check = path[depth-1]
    if isinstance(node_check, str):
        if current_node.tag != node_check:
            return
    elif node_check is not None:
        if not isinstance(current_node, node_check):
            return
    if index_check is True and current_index is not None:
        return
    if (index_check is False or index_check is None)    \
            and current_index is None:
        return
    if isinstance(index_check, str):
        if not (isinstance(current_index, ScalarNode)
                and index_check == current_index.value):
            return
    elif isinstance(index_check, int) and not isinstance(index_check, bool):
        if index_check != current_index:
            return
    return True
    */
  },

  resolve: function (kind, value, implicit) {
    /* TBI
    if kind is ScalarNode and implicit[0]:
        if value == '':
            resolvers = self.yaml_implicit_resolvers.get('', [])
        else:
            resolvers = self.yaml_implicit_resolvers.get(value[0], [])
        resolvers += self.yaml_implicit_resolvers.get(None, [])
        for tag, regexp in resolvers:
            if regexp.match(value):
                return tag
        implicit = implicit[1]
    if self.yaml_path_resolvers:
        exact_paths = self.resolver_exact_paths[-1]
        if kind in exact_paths:
            return exact_paths[kind]
        if None in exact_paths:
            return exact_paths[None]
    if kind is ScalarNode:
        return self.DEFAULT_SCALAR_TAG
    elif kind is SequenceNode:
        return self.DEFAULT_SEQUENCE_TAG
    elif kind is MappingNode:
        return self.DEFAULT_MAPPING_TAG
    */
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
