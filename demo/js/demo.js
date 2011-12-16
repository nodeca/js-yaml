window.runDemo = function runDemo() {
  'use strict';

  var source, result, initial, permalink, timer1, timer2 = null,
      hash = location.hash.toString();

  function parse() {
    var str;

    try {
      str = source.getValue();

      permalink.href = '#yaml=' + base64.encode(str);

      result.setOption('mode', 'javascript');
      result.setValue(inspect(jsyaml.load(str), false, 10));
    } catch (err) {
      result.setOption('mode', 'text/plain');
      result.setValue(err.toString());
    }
  }

  function updateSource(fallback) {
    var yaml;

    if (location.hash && '#yaml=' === location.hash.toString().slice(0,6)) {
      yaml = base64.decode(location.hash.slice(6));
    }

    source.setValue(yaml || fallback);
    parse();
  }

  function watchHashChange() {
    window.setTimeout(watchHashChange, 750);
    if (hash !== location.hash.toString()) {
      hash = location.hash.toString();
      updateSource();
    }
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
  updateSource(document.getElementById('source').value);

  // start monitor hash change
  watchHashChange();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
