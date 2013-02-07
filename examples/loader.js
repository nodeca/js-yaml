'use strict';


var yaml = require('../lib/js-yaml');


var cookiesType = new yaml.Type('!cookies', {
  loader: {
    kind: 'string',
    resolver: function (object, explicit) {
      return 'A ' + object + ' with some cookies!';
    }
  },
  dumper: {
    kind: 'string',
    representer: function (object, style) {
      var match = /^A (.+?) with some cookies!$/.exec(object);

      if (null !== match) {
        return match[1];
      } else {
        return yaml.NIL;
      }
    }
  }
});

var COOKIES_SCHEMA = new yaml.Schema({
  include:  [ yaml.DEFAULT_SCHEMA ],
  explicit: [ cookiesType ]
});

var loaded = yaml.load('!cookies coffee', { schema: COOKIES_SCHEMA });
var dumped = yaml.dump(loaded,            { schema: COOKIES_SCHEMA });


console.log(loaded);
console.log(dumped);


// Output:
//==============================================================================
// A coffee with some cookies!
// !<!cookies> "coffee"
