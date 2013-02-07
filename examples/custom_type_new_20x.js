// JS-YAML 2.0.x
'use strict';


var yaml = require('../lib/js-yaml');


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


console.log(yaml.load('!cookies [ coffee, tea, milk ]', { schema: COOKIES_SCHEMA }));


// Output:
//==============================================================================
// [ 'A coffee with some cookies!',
//   'A tea with some cookies!',
//   'A milk with some cookies!' ]
