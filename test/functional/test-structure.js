var test = module.exports = {},
    fs = require('fs'),
    assert = require('assert'),
    jsyaml = require(__dirname + '/../../lib/js-yaml'),
    helper = require(__dirname + '/../test-helper'),
    _loader = require(__dirname + '/../../lib/js-yaml/loader'),
    _events = require(__dirname + '/../../lib/js-yaml/events');


var convertStructure = function convertStructure(loader) {
  var event, sequence, mapping, key, value;

  if (loader.checkEvent(_events.ScalarEvent)) {
    event = loader.getEvent();
    return (!!event.tag || !!event.anchor || !!event.value);
  } else if (loader.checkEvent(_events.SequenceStartEvent)) {
    sequence = [];

    loader.getEvent();
    while (!loader.checkEvent(_events.SequenceEndEvent)) {
      sequence.push(convertStructure(loader));
    }
    loader.getEvent();

    return sequence;
  } else if (loader.checkEvent(_events.MappingStartEvent)) {
    mapping = [];

    loader.getEvent();
    while (!loader.checkEvent(_events.MappingEndEvent)) {
      key = convertStructure(loader);
      value = convertStructure(loader);
      mapping.push([key, value]);
    }
    loader.getEvent();

    return mapping;
  } else if (loader.checkEvent(_events.AliasEvent)) {
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
      loader = new _loader.SafeLoader(fs.readFileSync(data_filename, 'utf8'));

  while (loader.checkEvent()) {
    if (loader.checkEvent(_events.StreamStartEvent, _events.StreamEndEvent,
                          _events.DocumentStartEvent, _events.DocumentEndEvent)) {
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
