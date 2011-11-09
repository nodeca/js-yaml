window.runDemo = function runDemo() {
  var jsyaml = require('/lib/js-yaml'), source, result, initial;


  function parse(_, evt) {
    var obj;

    if (evt) {
      if (evt.type != 'keyup') return;
      switch (evt.keyCode) {
        case 37:
        case 38:
        case 39:
        case 40:
          return;
      }
    }

    try {
      obj = jsyaml.load(source.getValue().trim());
      result.setOption('mode', 'javascript');
      result.setValue(inspect(obj, false, 10));
    } catch (err) {
      result.setOption('mode', 'text/plain');
      result.setValue(err.toString());
    }
  }

  document.getElementById('permalink-trigger').addEventListener('click', function (evt) {
    var base, hash, field;

    field = document.getElementById('permalink-value');
  
    try {
      hash = base64.encode(source.getValue());
      base = window.location.toString();

      if (-1 !== base.indexOf('#')) {
        base = base.slice(0, base.indexOf('#'));
      }

      field.value = base + '#' + hash;
    } catch (err) {
      field.value = err.toString();
    }
  });

  source = CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    undoDepth: 1,
    onKeyEvent: parse
  });

  result = CodeMirror.fromTextArea(document.getElementById('result'), {
    readOnly: true
  });

  // try to get initial value from hash part
  if (location.hash && '#' === location.hash[0]) {
    initial = base64.decode(location.hash.slice(1));
  }

  // initial source text
  source.setValue(initial || document.getElementById('source').value);

  // initial parse
  parse();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
