window.runDemo = function runDemo() {
  var jsyaml = require('/lib/js-yaml'), source, result;


  function parse(_, e) {
    var obj;

    if (e) {
      if (e.type != 'keyup') return;
      switch (e.keyCode) {
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


  source = CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    undoDepth: 1,
    onKeyEvent: parse
  });

  result = CodeMirror.fromTextArea(document.getElementById('result'), {
    readOnly: true
  });

  // initial source text
  source.setValue(document.getElementById('source').value);

  // initial parse
  parse();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
