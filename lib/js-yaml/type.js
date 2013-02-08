'use strict';


var common        = require('./common');
var YAMLException = require('./exception');


// TODO: Add tag format check.
function Type(tag, settings) {
  this.tag    = tag;
  this.loader = common.getOption(settings, 'loader', null);
  this.dumper = common.getOption(settings, 'dumper', null);

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


Type.Loader = function TypeLoader(settings) {
  this.kind     = common.getSetting(settings, 'kind');
  this.resolver = common.getOption(settings, 'resolver', null);

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


Type.Dumper = function TypeDumper(settings) {
  this.kind         = common.getSetting(settings, 'kind');
  this.defaultStyle = common.getOption(settings, 'defaultStyle', null);
  this.instanceOf   = common.getOption(settings, 'instanceOf',   null);
  this.predicate    = common.getOption(settings, 'predicate',    null);
  this.representer  = common.getOption(settings, 'representer',  null);
  this.styleAliases = compileAliases(common.getOption(settings, 'styleAliases', null));

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
