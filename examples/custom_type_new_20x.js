// JS-YAML 2.0.x

var yaml = require('js-yaml');

var cookiesType = new yaml.Type('!cookies', {
  loader: {
    kind: 'array',
    resolver: function (array, explicit) {
      var index, length;

      for (index = 0, length = array.length; index < length; index += 1) {
        array[index] = 'A ' + array[index] + ' with some cookies!';
      }

      return array;
    }
  }
});

var COOKIES_SCHEMA = new yaml.Schema({
  include:  [ yaml.DEFAULT_SCHEMA ],
  explicit: [ cookiesType ]
});

console.log(yaml.load(data, { schema: COOKIES_SCHEMA }));
