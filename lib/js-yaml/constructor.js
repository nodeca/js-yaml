'use strict';


var JS = global.JS,
    exports = module.exports = {},
    $$ = require('./core'),
    __ = $$.import('types', 'error', 'nodes');


JS.require('JS.Class');


var ConstructorError = exports.ConstructorError =
    new JS.Class('ConstructorError', __.MarkedYAMLError, {});


var BOOL_VALUES = {
  'y':        true,
  'yes':      true,
  'n':        false,
  'no':       false,
  'true':     true,
  'false':    false,
  'on':       true,
  'off':      false,
};


var TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'           + // [1] year
  '-([0-9][0-9]?)'                    + // [2] month
  '-([0-9][0-9]?)'                    + // [3] day
  '(?:(?:[Tt]|[ \\t]+)'               + // ...
  '([0-9][0-9]?)'                     + // [4] hour
  ':([0-9][0-9])'                     + // [5] minute
  ':([0-9][0-9])'                     + // [6] second
  '(?:\\.([0-9]*))?'                  + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)'  + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?)?$'            // [11] tz_minute
);


var BaseConstructor = exports.BaseConstructor = new JS.Class('BaseConstructor', {
  extend: {
    __init__: function (self) {
      self.constructedObjects = new $$.Hash();
      self.recursiveObjects = new $$.Hash();
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
        statePopulators;

    while (!!this.statePopulators.length) {
      statePopulators = this.statePopulators;
      this.statePopulators = [];

      statePopulators.forEach(function (populator) {
        populator.execute();
      });
    }

    this.constructedObjects = new $$.Hash();
    this.recursiveObjects = new $$.Hash();
    this.deepConstruct = false;

    return data;
  },

  constructObject: function (node, deep) {
    var data, old_deep, constructor, populator;

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

    if (undefined !== this.yamlConstructors[node.tag]) {
      constructor = this.yamlConstructors[node.tag];
    } else {
      if (undefined !== this.yamlConstructors[null]) {
        constructor = this.yamlConstructors[null];
      } else {
        throw new ConstructorError(null, null,
                    "can't find any constructor for tag=" + node.tag,
                    node.startMark);
      }
    }

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

    $$.each(node.value, function (pair) {
      var key_node = pair[0], value_node = pair[1], key, value;

      key = this.constructObject(key_node, deep);
      // TODO: Replace with interface test???
      if (!node.isA(__.Hashable)) {
        throw new ConstructorError("while constructing a mapping", node.startMark,
                    "found unhashable key", node.startMark);
      }
      value = this.constructObject(value_node, deep);

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

    while (index < node.value.length) {
      keyNode = node.value[index][0];
      valueNode = node.value[index][1];

      if ('tag:yaml.org,2002:merge' === keyNode.tag) {
        node.value.splice(index, 1);

        if (valueNode.isA(__.MappingNode)) {
          this.flattenMapping(valueNode);
          $$.each(valueNode.value, function (value) {
            merge.push(value);
          });
        } else if (valueNode.isA(__.SequenceNode)) {
          submerge = [];
          $$.each(valueNode.value, function (subnode) {
            if (!subnode.isA(__.MappingNode)) {
              throw new ConstructorError("while constructing a mapping", node.startMark,
                          "expected a mapping for merging, but found " + subnode.id,
                          subnode.startMark);
            }
            this.flattenMapping(subnode);
            submerge.push(subnode.value);
          }.bind(this));

          $$.reverse(submerge).forEach(function (values) {
            values.forEach(function (value) {
              merge.push(value);
            });
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
      $$.each(node.value, function (value) { merge.push(value); });
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
    var value = this.constructScalar(node).replace(/_/g, ''),
        sign = ('-' === value[0]) ? -1 : 1,
        base, digits = [];

    if (0 <= '+-'.indexOf(value[0])) {
      value = value.slice(1);
    }

    if ('0' === value) {
      return 0;
    } else if (/^0b/.test(value)) {
      return sign * parseInt(value.slice(2), 2);
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
        value += (d * base);
        base *= 60;
      });
      return sign * value;
    } else {
      return sign * parseInt(value, 10);
    }
  },

  constructYamlFloat: function (node) {
    var value = this.constructScalar(node).replace(/_/g, ''),
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
    try {
      return $$.decodeBase64(this.constructScalar(node));
    } catch (err) {
      throw new ConstructorError(null, null,
                  "failed to decode base64 data: " + err.toString(), node.startMark);
    }
  },

  constructYamlTimestamp: function (node) {
    var match, year, month, day, hour, minute, second, fraction = 0,
        delta = null, tz_hour, tz_minute, data;

    match = TIMESTAMP_REGEXP.exec(this.constructScalar(node));

    // match: [1] year [2] month [3] day

    year = +(match[1]);
    month = +(match[2]);
    day = +(match[3]);

    if (!match[4]) { // no hour
      return new Date(year, month, day);
    }

    // match: [4] hour [5] minute [6] second [7] fraction

    hour = +(match[4]);
    minute = +(match[5]);
    second = +(match[6]);

    if (!!match[7]) {
      fraction = match[7].slice(0,6);
      while (fraction.length < 6) {
        fraction += '0';
      }
      fraction = +fraction;
    }

    // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

    if (!!match[9]) {
      tz_hour = +(match[10]);
      tz_minute = +(match[11] || 0);
      delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
      if ('-' === match[9]) {
        delta = -delta;
      }
    }

    data = new Date(year, month, day, hour, minute, second, fraction);

    if (!!delta) {
      data.setTime(data.getTime() - delta);
    }

    return data;
  },


  constructYamlOmap: function (node) {
    var omap = [];
    return $$.Populator(omap, function () {
      if (!node.isA(__.SequenceNode)) {
        throw new ConstructorError("while constructing an ordered map", node.startMark,
                    "expected a sequence, but found " + node.id, node.startMark);
      }

      node.value.forEach(function (subnode) {
        var data, key, value;

        if (!subnode.isA(__.MappingNode)) {
          throw new ConstructorError("while constructing an ordered map", node.startMark,
                      "expected a mapping of length 1, but found " + subnode.id,
                      subnode.startMark);
        }

        if (1 !== subnode.value.length) {
          throw new ConstructorError("while constructing an ordered map", node.startMark,
                        "expected a single mapping item, but found " + subnode.value.length + " items",
                        subnode.startMark);
        }

        key = this.constructObject(subnode.value[0][0]);
        value = this.constructObject(subnode.value[0][1]);
        data = Object.create(null);

        data[key] = value;

        omap.push(data);
      }.bind(this));
    }, this);
  },


  constructYamlPairs: function (node) {
    var pairs = [];
    return $$.Populator(pairs, function () {
      if (!node.isA(__.SequenceNode)) {
         throw new ConstructorError("while constructing pairs", node.startMark,
                     "expected a sequence, but found " + node.id, node.startMark);
      }

      node.value.forEach(function (subnode) {
        var key, value;
       
        if (!subnode.isA(__.MappingNode)) {
          throw new ConstructorError("while constructing pairs", node.startMark,
                      "expected a mapping of length 1, but found " + subnode.id,
                      subnode.startMark);
        }

        if (1 !== subnode.value.length) {
          throw new ConstructorError("while constructing pairs", node.startMark,
                      "expected a single mapping item, but found " + subnode.value.length + " items",
                      subnode.startMark);
        }

        key = this.constructObject(subnode.value[0][0]);
        value = this.constructObject(subnode.value[0][1]);

        pairs.push([key, value]);
      }.bind(this));
    }, this);
  },


  constructYamlSet: function (node) {
    var data = [];
    return $$.Populator(data, function () {
      $$.extend(data, this.constructMapping(node));
    }, this);
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
