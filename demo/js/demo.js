window.runDemo = function runDemo() {
  var jsyaml = require('/lib/js-yaml'), source, result, initial;


  function updatePermlink(str) {
    var base, hash, field;

    field = document.getElementById('permalink');
  
    try {
      hash = base64.encode(str);
      base = window.location.toString();

      if (-1 !== base.indexOf('#')) {
        base = base.slice(0, base.indexOf('#'));
      }

      field.value = base + '/#!/yaml/' + hash;
    } catch (err) {
      field.value = err.toString();
    }
  }


  function parse(_, evt) {
    var str;

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
      str = source.getValue();
      updatePermlink(str);
      result.setOption('mode', 'javascript');
      result.setValue(inspect(jsyaml.load(str), false, 10));
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

  // try to get initial value from hash part
  if (location.hash && '#!/yaml/' === location.hash.toString().slice(0,8)) {
    initial = base64.decode(location.hash.slice(8));
  }

  // initial source text
  source.setValue(initial || document.getElementById('source').value);

  // initial parse
  parse();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
