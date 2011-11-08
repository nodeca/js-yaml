$(function () {
  var jsyaml = require('/lib/js-yaml'),
      $source = $('#source'),
      $result = $('#result');

  // Default source text
  $source.val(
    '---\n' +
    'YAML: YAML Ain\'t Markup Language\n' +
    'JS-YAML: !!pairs\n' +
    '  - It is: YAML implementation proted from PyYAML\n' +
    '  - Written in: JavaScript\n' +
    '  - Copyrights belongs to: Vitaly Puzrin\n' +
    '  - Authored by:\n' +
    '      name: Aleksey V Zapparov\n' +
    '      web: http://www.ixti.net/\n'
  );


  function parse() {
    var obj;

    try {
      obj = jsyaml.load($source.val().trim());
      $result.val(inspect(obj, false, 10));
    } catch (err) {
      $result.val(err.toString());
    }
  }

  $source.on('keyup', function (e) {
    if (e) {
      switch (e.keyCode) {
        case 37:
        case 38:
        case 39:
        case 40:
          return;
      }
    }

    parse();
  });

  parse();
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
