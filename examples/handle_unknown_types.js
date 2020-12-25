'use strict';

/*eslint-disable no-console*/

const util = require('util');
const yaml = require('../');


class CustomTag {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}


const tags = [ 'scalar', 'sequence', 'mapping' ].map(function (kind) {
  // first argument here is a prefix, so this type will handle anything starting with !
  return new yaml.Type('!', {
    kind: kind,
    multi: true,
    representName: function (object) {
      return object.type;
    },
    represent: function (object) {
      return object.data;
    },
    instanceOf: CustomTag,
    construct: function (data, type) {
      return new CustomTag(type, data);
    }
  });
});

const SCHEMA = yaml.DEFAULT_SCHEMA.extend(tags);

const data = `
subject: Handling unknown types in JS-YAML
scalar: !unknown_scalar_tag foo bar
sequence: !unknown_sequence_tag [ 1, 2, 3 ]
mapping: !unknown_mapping_tag { foo: 1, bar: 2 }
`;

const loaded = yaml.load(data, { schema: SCHEMA });

console.log('Parsed as:');
console.log('-'.repeat(70));
console.log(util.inspect(loaded, false, 20, true));

console.log('');
console.log('');
console.log('Dumped as:');
console.log('-'.repeat(70));
console.log(yaml.dump(loaded, { schema: SCHEMA }));
