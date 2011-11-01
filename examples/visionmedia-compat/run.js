
var path = process.argv[2],
    fs = require('fs'),
    yaml = require('../../lib/js-yaml')
    
if (!path)
  throw new Error('provide path to yaml file')

fs.readFile(path, function(err, fileContents) {
  fileContents = fileContents.toString()
  console.log('\n')
  console.log(fileContents)
  console.log('\noutputs:\n')
  try {
    console.log(yaml.eval(fileContents))
  } catch (err) {
    console.error(err.toString());
  }
})
