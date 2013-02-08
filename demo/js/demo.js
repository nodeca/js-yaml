/*global window, document, location, CodeMirror, jsyaml, inspect, base64, hasher*/


window.runDemo = function runDemo() {
  'use strict';

  var source, result, initial, permalink, timer1, timer2 = null,
      fallback = document.getElementById('source').value || '';

  // add sexy constructor
  var sexyType = new jsyaml.Type('!sexy', {
    loader: {
      kind: 'array',
      resolver: function (object, explicit) {
        var index, length;

        for (index = 0, length = object.length; index < length; index += 1) {
          object[index] = 'sexy ' + object[index];
        }

        return object;
      }
    }
  });

  var SEXY_SCHEMA = jsyaml.Schema.create([ sexyType ]);

  function parse() {
    var str, obj;

    try {
      str = source.getValue();
      obj = jsyaml.load(str, { schema: SEXY_SCHEMA });

      permalink.href = '#yaml=' + base64.encode(str);

      result.setOption('mode', 'javascript');
      result.setValue(inspect(obj, false, 10));
    } catch (err) {
      result.setOption('mode', 'text/plain');
      result.setValue(err.stack || err.message || String(err));
    }
  }

  function updateSource() {
    var yaml;

    if (location.hash && '#yaml=' === location.hash.toString().slice(0,6)) {
      yaml = base64.decode(location.hash.slice(6));
    }

    source.setValue(yaml || fallback);
    parse();
  }

  permalink = document.getElementById('permalink');

  source = CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    undoDepth: 1,
    onKeyEvent: function (_, evt) {
      switch (evt.keyCode) {
        case 37:
        case 38:
        case 39:
        case 40:
          return;
      }

      if (evt.type === 'keyup') {
        window.clearTimeout(timer1);
        timer1 = window.setTimeout(parse, 500);

        if (null === timer2) {
          timer2 = setTimeout(function () {
            window.clearTimeout(timer1);
            window.clearTimeout(timer2);
            timer2 = null;
            parse();
          }, 1000);
        }
      }
    }
  });

  result = CodeMirror.fromTextArea(document.getElementById('result'), {
    readOnly: true
  });

  // initial source
  updateSource();

  // start monitor hash change
  hasher.prependHash = '';
  hasher.changed.add(updateSource);
  hasher.initialized.add(updateSource);
  hasher.init();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
