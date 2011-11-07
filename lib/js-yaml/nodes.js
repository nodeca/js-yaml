'use strict';


var $$ = require('./core'),
    __ = $$.import('types');


module.exports = $$.expose(ScalarNode, SequenceNode, MappingNode);


function GenericNode(tag, value, startMark, endMark) {
  this.tag = tag;
  this.value = value;
  this.startMark = startMark || null;
  this.endMark = endMark || null;
};

GenericNode.prototype.hash =
GenericNode.prototype.toString = function toString() {
  var value = this.value.toString();
  return this.constructor.name + '(' + this.tag + ', ' + value + ')';
};


GenericNode.prototype.isA = function (klass) {
  try {
    throw Error('OBSOLETE');
  } catch (err) {
    console.error(err.stack);
    return $$.isInstanceOf(this, klass);
  }
};


function ScalarNode(tag, value, startMark, endMark, style) {
  GenericNode.call(this, tag, value, startMark, endMark);
  this.style = style || null;
};
$$.inherits(ScalarNode, GenericNode);
ScalarNode.id = 'scalar';


function CollectionNode(tag, value, startMark, endMark, flowStyle) {
  GenericNode.call(this, tag, value, startMark, endMark);
  this.flowStyle = flowStyle || null;
};
$$.inherits(CollectionNode, GenericNode);


function SequenceNode() { CollectionNode.apply(this, arguments); }
$$.inherits(SequenceNode, CollectionNode);
SequenceNode.id = 'sequence';


function MappingNode() { CollectionNode.apply(this, arguments); }
$$.inherits(MappingNode, CollectionNode);
MappingNode.id = 'mapping';


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
