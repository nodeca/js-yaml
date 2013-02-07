// JS-YAML version 1.x.x (deprecated)

var yaml = require('js-yaml');

yaml.addConstructor('!cookies', function (node) {
  var array, index, length;

  array = this.constructSequence(node);

  for (index = 0, length = array.length; index < length; index += 1) {
    array[index] = 'A ' + array[index] + ' with some cookies!';
  }

  return array;
});

console.log(yaml.load(data));
