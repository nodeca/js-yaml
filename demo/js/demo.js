window.runDemo = function runDemo() {
  var jsyaml = require('/lib/js-yaml'), source, result, initial, history,
      timer1, timer2;


  history = (window.history && window.history.replaceState)
          ? function (url) { window.history.replaceState({}, 'YAML', url); }
          : function (url) { window.location = url; };


  function parse() {
    var str, base, hash;

    try {
      str = source.getValue();
      hash = base64.encode(str);
      base = window.location.toString();

      if (-1 !== base.indexOf('#')) {
        base = base.slice(0, base.indexOf('#'));
      }

      history(base + '#!/yaml/' + hash);

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
    onKeyEvent: function (_, evt) {
      if (evt.type != 'keyup') {
        window.clearTimeout(timer1);
        window.clearTimeout(timer2);

        timer1 = window.setTimeout(parse, 500);
        window.setTimeout(function () {
          timer2 = window.setTimeout(parse, 1000);
        });
      }
    }
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
