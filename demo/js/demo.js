$(function () {
  var jsyaml = require('/lib/js-yaml'),
      $source = $('#source'),
      $result = $('#result');

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
