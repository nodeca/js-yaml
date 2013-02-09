'use strict';


var common        = require('./common');
var YAMLException = require('./exception');


// TODO: Add tag format check.
function Type(tag, options) {
  this.tag    = tag;
  this.loader = common.getOption(options, 'loader', null);
  this.dumper = common.getOption(options, 'dumper', null);

  if (null === this.loader && null === this.dumper) {
    throw new YAMLException('Incomplete YAML type definition. "loader" or "dumper" setting must be specified.');
  }

  if (null !== this.loader) {
    this.loader = new Type.Loader(this.loader);
  }

  if (null !== this.dumper) {
    this.dumper = new Type.Dumper(this.dumper);
  }
}


Type.Loader = function TypeLoader(options) {
  this.kind     = common.getSetting(options, 'kind');
  this.resolver = common.getOption(options, 'resolver', null);

  if ('string' !== this.kind &&
      'array'  !== this.kind &&
      'object' !== this.kind) {
    throw new YAMLException('Unacceptable "kind" setting of a type loader.');
  }
};


function compileAliases(map) {
  var result = {};

  if (null !== map) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}


Type.Dumper = function TypeDumper(options) {
  this.kind         = common.getSetting(options, 'kind');
  this.defaultStyle = common.getOption(options, 'defaultStyle', null);
  this.instanceOf   = common.getOption(options, 'instanceOf',   null);
  this.predicate    = common.getOption(options, 'predicate',    null);
  this.representer  = common.getOption(options, 'representer',  null);
  this.styleAliases = compileAliases(common.getOption(options, 'styleAliases', null));

  if ('undefined' !== this.kind &&
      'null'      !== this.kind &&
      'boolean'   !== this.kind &&
      'integer'   !== this.kind &&
      'float'     !== this.kind &&
      'string'    !== this.kind &&
      'array'     !== this.kind &&
      'object'    !== this.kind &&
      'function'  !== this.kind) {
    throw new YAMLException('Unacceptable "kind" setting of a type dumper.');
  }
};


module.exports = Type;
