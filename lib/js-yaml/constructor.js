'use strict';


JS.require('JS.Class');
JS.require('JS.Hash');


var $$ = require('./core'),
    __ = $$.import('types', 'error', 'nodes'),
    debug = require('./debug');


var ConstructorError = exports.ConstructorError =
    new JS.Class('ConstructorError', __.MarkedYAMLError, {});


var BOOL_VALUES = {
  'yes':      true,
  'no':       false,
  'true':     true,
  'false':    false,
  'on':       true,
  'off':      false,
};


var BaseConstructor = exports.BaseConstructor = new JS.Class('BaseConstructor', {
  extend: {
    __init__: function (self) {
      self.constructedObjects = new JS.Hash();
      self.recursiveObjects = new JS.Hash();
      self.statePopulators = []; // was state_generators
      self.deepConstruct = false;
      self.yamlConstructors = this.yamlConstructors;
    },
    yamlConstructors: {},
    addConstructor: function (tag, constructor) {
      this.yamlConstructors[tag] = constructor;
    }
  },

  initialize: function () {
    exports.BaseConstructor.__init__(this);
  },

  checkData: function () {
    return this.checkNode();
  },

  getData: function () {
    if (this.checkNode()) {
      return this.constructDocument(this.getNode());
    }
  },

  getSingleData: function () {
    // WTF!!! getSingleNode - is a composer's method
    var node = this.getSingleNode();
    if (null !== node) {
      return this.constructDocument(node);
    }
    return null;
  },

  constructDocument: function (node) {
    var data = this.constructObject(node),
        statePopulators = this.statePopulators;

    this.statePopulators = [];

    statePopulators.forEach(function (populator) {
      populator.execute();
    });

    this.constructedObjects = {};
    this.recursiveObjects = {};
    this.deepConstruct = false;

    return data;
  },

  constructObject: function (node, deep) {
    var data, old_deep, constructor, populator;

    if (debug.ENABLED) {
      debug('constructor#constructObject', {node: node});
    }

    if (this.constructedObjects.hasKey(node)) {
      return this.constructedObjects.get(node);
    }

    if (!!deep) {
      old_deep = this.deepConstruct;
      this.deepConstruct = true;
    }

    if (this.recursiveObjects.hasKey(node)) {
      throw new ConstructorError(null, null,
                  "found unconstructable recursive node",
                  node.startMark);
    }

    this.recursiveObjects.store(node, null);

    constructor = this.yamlConstructors[node.tag || null];
    data = constructor.call(this, node);

    if (data instanceof $$.Populator) {
      populator = data;
      data = populator.data;

      if (this.deepConstruct) {
        populator.execute();
      } else {
        this.statePopulators.push(populator);
      }
    }

    this.constructedObjects.store(node, data);
    this.recursiveObjects.remove(node);

    if (deep) {
      this.deepConstruct = old_deep;
    }

    return data;
  },

  constructScalar: function (node) {
    if (!node.isA(__.ScalarNode)) {
      throw new ConstructorError(null, null,
                  "expected a scalar node, but found " + node.id,
                  node.startMark);
    }

    return node.value;
  },

  constructSequence: function (node, deep) {
    if (!node.isA(__.SequenceNode)) {
      throw new ConstructorError(null, null,
                  "expected a sequence node, but found " + node.id,
                  node.startMark);
    }

    return node.value.map(function (child) {
      return this.constructObject(child, deep);
    }, this);
  },

  constructMapping: function (node, deep) {
    var mapping;

    if (!node.isA(__.MappingNode)) {
      throw new ConstructorError(null, null,
                  "expected a mapping node, but found " + node.id,
                  node.startMark);
    }

    mapping = {};

    if (debug.ENABLED) {
      debug('constructor#constructMapping -- constructing', {value: node.value});
    }

    $$.each(node.value, function (pair) {
      var key_node = pair[0], value_node = pair[1], key, value;

      if (debug.ENABLED) {
        debug('constructor#constructMapping -- got pair', {pair: pair});
      }
      
      key = this.constructObject(key_node, deep);
      // TODO: Replace with interface test???
      if (!node.isA(__.Hashable)) {
        throw new ConstructorError("while constructing a mapping", node.startMark,
                    "found unhashable key", node.startMark);
      }
      value = this.constructObject(value_node, deep);

      if (debug.ENABLED) {
        debug('constructor#constructMapping -- constructed', {key: key, value: value});
      }

      mapping[key] = value;
    }, this);

    return mapping;
  },

  constructPairs: function (node, deep) {
    var pairs;

    if (!node.isA(__.MappingNode)) {
      throw new ConstructorError(null, null,
                  "expected a mapping node, but found " + node.id,
                  node.startMark);
    }

    pairs = [];
    node.forEachPair(function (key_node, value_node) {
      var key, value;
      key = this.constructObject(key_node, deep);
      value = this.constructObject(value_node, deep);
      pairs.store(key, value);
    }, this);

    return pairs;
  }
});


var SafeConstructor = exports.SafeConstructor = new JS.Class('SafeConstructor', BaseConstructor, {
  extend: {
    yamlConstructors: {},
    addConstructor: function (tag, constructor) {
      this.yamlConstructors[tag] = constructor;
    }
  },

  constructScalar: function (node) {
    var result;

    if (debug.ENABLED) {
      debug('constructor#constructScalar', {node: node});
    }

    if (node.isA(__.MappingNode)) {
      $$.each(node.value, function (pair) {
        var key_node = pair[0], value_node = pair[1], value;

        if ('tag:yaml.org,2002:value' === key_node.tag) {
          result = this.constructScalar(value_node);
        }
      }, this);

      if (undefined !== result) {
        return result;
      }
    }

    return this.callSuper(node);
  },

  flattenMapping: function (node) {
    var merge = [], index = 0, keyNode, valueNode, submerge;

    if (debug.ENABLED) {
      debug('constructor#flattenMapping -- start', {value: node.value});
    }

    while (index < node.value.length) {
      keyNode = node.value[index][0];
      valueNode = node.value[index][1];

      debug('constructor#flattenMapping -- pair', {index: index, key: keyNode, val: valueNode});

      if ('tag:yaml.org,2002:merge' === keyNode.tag) {
        delete node.value[index];

        if (valueNode.isA(__.MappingNode)) {
          this.flattenMapping(valueNode);
          valueNode.value.forEach(function (value) {
            merge.push(value);
          });
        } else if (valueNode.isA(__.SequenceNode)) {
          submerge = [];
          valueNode.forEach(function (subnode) {
            if (!subnode.isA(__.MappingNode)) {
              throw new ConstructorError("while constructing a mapping", node.startMark,
                          "expected a mapping for merging, but found " + subnode.id,
                          subnode.startMark);
            }
            this.flattenMapping(subnode);
            submerge.push(subnode.value);
          }.bind(this));
          $$.reverse(submerge).forEach(function (value, idx) {
            merge[idx] = value;
          });
        } else {
          throw new ConstructorError("while constructing a mapping", node.startMark,
                      "expected a mapping or list of mappings for merging, but found " + valueNode.id,
                      valueNode.startMark);
        }
      } else if ('tag:yaml.org,2002:value' === keyNode.tag) {
        keyNode.tag = 'tag:yaml.org,2002:str';
        index++;
      } else {
        index++;
      }
    }

    if (!!merge.length) {
      node.value.forEach(function (value) { merge.push(value); });
      node.value = merge;
    }
  },

  constructMapping: function (node, deep) {
    if (node.isA(__.MappingNode)) {
      this.flattenMapping(node);
    }
    return this.callSuper(node);
  },

  constructYamlNull: function (node) {
    this.constructScalar(node);
    return null;
  },

  constructYamlBool: function (node) {
    var value = this.constructScalar(node);
    return BOOL_VALUES[value.toLowerCase()];
  },

  constructYamlInt: function (node) {
    var value = this.constructScalar(node).replace('_', ''),
        sign = ('-' === value[0]) ? -1 : 1,
        base, digits = [];

    if (0 <= '+-'.indexOf(value[0])) {
      value = value.slice(1);
    }

    if ('0' === value) {
      return 0;
    } else if (/^0b/.test(value)) {
      return sign * parseInt(value, 2);
    } else if (/^0x/.test(value)) {
      return sign * parseInt(value, 16);
    } else if ('0' === value[0]) {
      return sign * parseInt(value, 8);
    } else if (0 <= value.indexOf(':')) {
      value.split(':').forEach(function (v) {
        digits.unshift(parseInt(v, 10));
      });
      value = 0;
      base = 1;
      digits.forEach(function (d) {
        value += d * base;
        base *= 60;
      });
      return sign * value;
    } else {
      return sign * parseInt(value, 10);
    }
  },

  constructYamlFloat: function (node) {
    var value = this.constructScalar(node).replace('_', ''),
        sign = ('-' === value[0]) ? -1 : 1,
        base, digits = [];

    if (0 <= '+-'.indexOf(value[0])) {
      value = value.slice(1);
    }

    if ('.inf' === value) {
      return (1 === sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if ('.nan' === value) {
      return NaN;
    } else if (0 <= value.indexOf(':')) {
      value.split(':').forEach(function (v) {
        digits.unshift(parseFloat(v, 10));
      });
      value = 0.0;
      base = 1;
      digits.forEach(function (d) {
        value += d * base;
        base *= 60;
      });
      return sign * value;
    } else {
      return sign * parseFloat(value, 10);
    }
  },

  constructYamlBinary: function (node) {
    return "BNARY: Not Implemented Yet";
  },

  constructYamlTimestamp: function (node) {
    return "TIMESTAMP: Not Implemented Yet";
  },


  constructYamlOmap: function (node) {
    return "OMAP: Not Implemented Yet";
  },


  constructYamlPairs: function (node) {
    return "PAIRS: Not Implemented Yet";
  },


  constructYamlSet: function (node) {
    return "SET: Not Implemented Yet";
  },


  constructYamlStr: function (node) {
    return this.constructScalar(node);
  },


  constructYamlSeq: function (node) {
    var data = [];
    return $$.Populator(data, function () {
      this.constructSequence(node).forEach(function (value) {
        data.push(value);
      });
    }, this);
  },


  constructYamlMap: function (node) {
    var data = {};
    return $$.Populator(data, function () {
      $$.extend(data, this.constructMapping(node, true));
    }, this);
  },


  constructUndefined: function (node) {
    if (debug.ENABLED) {
      debug('constructor#constructUndefined', {node: node});
    }

    throw new ConstructorError(null, null,
                "could not determine constructor for the tag " + node.tag,
                node.startMark);
  }
});


SafeConstructor.addConstructor(
    'tag:yaml.org,2002:null',
    SafeConstructor.instanceMethod('constructYamlNull'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:bool',
    SafeConstructor.instanceMethod('constructYamlBool'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:int',
    SafeConstructor.instanceMethod('constructYamlInt'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:float',
    SafeConstructor.instanceMethod('constructYamlFloat'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:binary',
    SafeConstructor.instanceMethod('constructYamlBinary'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:timestamp',
    SafeConstructor.instanceMethod('constructYamlTimestamp'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:omap',
    SafeConstructor.instanceMethod('constructYamlOmap'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:pairs',
    SafeConstructor.instanceMethod('constructYamlPairs'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:set',
    SafeConstructor.instanceMethod('constructYamlSet'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:str',
    SafeConstructor.instanceMethod('constructYamlStr'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:seq',
    SafeConstructor.instanceMethod('constructYamlSeq'));

SafeConstructor.addConstructor(
    'tag:yaml.org,2002:map',
    SafeConstructor.instanceMethod('constructYamlMap'));

SafeConstructor.addConstructor(
    null,
    SafeConstructor.instanceMethod('constructUndefined'));


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
