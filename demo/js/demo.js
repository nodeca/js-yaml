window.runDemo = function runDemo() {
  var jsyaml = require('/lib/js-yaml'), source, result, initial, permalink,
      timer1, timer2 = null;

  function parse() {
    var str;

    try {
      str = source.getValue();

      permalink.href = '#!/yaml/' + base64.encode(str);

      result.setOption('mode', 'javascript');
      result.setValue(inspect(jsyaml.load(str), false, 10));
    } catch (err) {
      result.setOption('mode', 'text/plain');
      result.setValue(err.toString());
    }
  }

  permalink = document.getElementById('permalink');

  source = CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    undoDepth: 1,
    onKeyEvent: function (_, evt) {
      if (evt.type != 'keyup') {
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
