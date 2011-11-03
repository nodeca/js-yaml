var test = module.exports = {},
    fs = require('fs'),
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    helper = require(__dirname + '/../test-helper'),
    $$ = require(__dirname + '/../../lib/js-yaml/core'),
    __ = $$.import('loader', 'events');


var convertStructure = function convertStructure(loader) {
  var event, sequence, mapping, key, value;

  if (loader.checkEvent(__.ScalarEvent)) {
    event = loader.getEvent();
    return (!!event.tag || !!event.anchor || !!event.value);
  } else if (loader.checkEvent(__.SequenceStartEvent)) {
    sequence = [];

    loader.getEvent();
    while (!loader.checkEvent(__.SequenceEndEvent)) {
      sequence.push(convertStructure(loader));
    }
    loader.getEvent();

    return sequence;
  } else if (loader.checkEvent(__.MappingStartEvent)) {
    mapping = [];

    loader.getEvent();
    while (!loader.checkEvent(__.MappingEndEvent)) {
      key = convertStructure(loader);
      value = convertStructure(loader);
      mapping.push([key, value]);
    }
    loader.getEvent();

    return mapping;
  } else if (loader.checkEvent(__.AliasEvent)) {
    loader.getEvent();
    return '*';
  } else {
    loader.getEvent();
    return '?';
  }
};


test.unittest = ['.data', '.structure'];
test.execute = function test_structure(data_filename, structure_filename) {
  var nodes1 = [],
      nodes2 = JSON.parse(fs.readFileSync(structure_filename, 'utf8')),
      loader = new __.SafeLoader(fs.readFileSync(data_filename, 'utf8'));

  while (loader.checkEvent()) {
    if (loader.checkEvent(__.StreamStartEvent, __.StreamEndEvent, __.DocumentStartEvent, __.DocumentEndEvent)) {
      loader.getEvent();
    } else {
      nodes1.push(convertStructure(loader));
    }
  }

  if (1 === nodes1.length) {
    nodes1 = nodes1.shift();
  }

  assert.deepEqual(nodes2, nodes1);
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
