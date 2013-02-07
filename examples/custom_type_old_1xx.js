// JS-YAML version 1.x.x (deprecated)
'use strict';


var yaml = require('../lib/js-yaml');


yaml.addConstructor('!cookies', function (node) {
  var array, index, length;

  array = this.constructSequence(node);

  for (index = 0, length = array.length; index < length; index += 1) {
    array[index] = 'A ' + array[index] + ' with some cookies!';
  }

  return array;
});


console.log(yaml.load('!cookies [ coffee, tea, milk ]'));


// Output:
//==============================================================================
// [ 'A coffee with some cookies!',
//   'A tea with some cookies!',
//   'A milk with some cookies!' ]
