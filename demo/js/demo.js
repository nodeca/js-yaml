window.runDemo = function runDemo() {
  var jsyaml = require('/lib/js-yaml'), source, result, initial, permalink,
      timer1, timer2 = null, current;

  function parse() {
    var str;

    try {
      str = source.getValue();

      current = permalink.href = '#yaml=' + base64.encode(str);

      result.setOption('mode', 'javascript');
      result.setValue(inspect(jsyaml.load(str), false, 10));
    } catch (err) {
      result.setOption('mode', 'text/plain');
      result.setValue(err.toString());
    }
  }

  function getHashSource() {
    if (location.hash && '#yaml=' === location.hash.toString().slice(0,6)) {
      return base64.decode(location.hash.slice(6));
    }
  }

  function watchHashChange() {
    var hash = location.hash.toString();
    window.setTimeout(watchHashChange, 750);
    if (0 < hash.length && current !== hash) {
      source.setValue(getHashSource());
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

  // initial source text
  source.setValue(getHashSource() || document.getElementById('source').value);

  // initial parse
  parse();

  // start monitor hash change
  watchHashChange();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
