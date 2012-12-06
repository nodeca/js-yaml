'use strict';


var assert = require('assert');
var _loader = require('../../lib/js-yaml/loader');
var _events = require('../../lib/js-yaml/events');
var functional = require('../support/functional');


function convertStructure(loader) {
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
}


functional.generateTests({
  description: 'Test structure.',
  files: ['.data', '.structure'],
  handler: function (dataFile, structureFile) {
    var result = [], expected, loader;

    expected = JSON.parse(structureFile.data);
    loader = new _loader.SafeLoader(dataFile.data);

    while (loader.checkEvent()) {
      if (loader.checkEvent(_events.StreamStartEvent,
                            _events.StreamEndEvent,
                            _events.DocumentStartEvent,
                            _events.DocumentEndEvent)) {
        loader.getEvent();
      } else {
        result.push(convertStructure(loader));
      }
    }

    if (1 === result.length) {
      result = result.shift();
    }

    assert.deepEqual(result, expected);
  }
});
