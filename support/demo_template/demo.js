/* eslint-env browser */

import { Type, DEFAULT_SCHEMA, load } from '../../dist/js-yaml.mjs';
import codemirror                     from 'codemirror';
import * as base64                    from './base64.js';
import { inspect }                    from 'util';

import 'codemirror/mode/yaml/yaml.js';
import 'codemirror/mode/javascript/javascript.js';

var source, result, permalink, default_text;

var SexyYamlType = new Type('!sexy', {
  kind: 'sequence', // See node kinds in YAML spec: http://www.yaml.org/spec/1.2/spec.html#kind//
  construct: function (data) {
    return data.map(function (string) { return 'sexy ' + string; });
  }
});

var SEXY_SCHEMA = DEFAULT_SCHEMA.extend([ SexyYamlType ]);

function parse() {
  var str, obj;

  str = source.getValue();
  permalink.href = '#yaml=' + base64.encode(str);

  try {
    obj = load(str, { schema: SEXY_SCHEMA });

    result.setOption('mode', 'javascript');
    result.setValue(inspect(obj, false, 10));
  } catch (err) {
    result.setOption('mode', 'text/plain');
    result.setValue(err.message || String(err));
  }
}

function updateSource() {
  var yaml;

  if (location.hash && location.hash.toString().slice(0, 6) === '#yaml=') {
    yaml = base64.decode(location.hash.slice(6));
  }

  source.setValue(yaml || default_text);
  parse();
}

window.onload = function () {
  permalink    = document.getElementById('permalink');
  default_text = document.getElementById('source').value || '';

  source = codemirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    lineNumbers: true
  });

  var timer;

  source.on('change', function () {
    clearTimeout(timer);
    timer = setTimeout(parse, 500);
  });

  result = codemirror.fromTextArea(document.getElementById('result'), {
    readOnly: true
  });

  // initial source
  updateSource();
};
