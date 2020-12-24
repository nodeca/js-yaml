'use strict';

/*eslint-disable no-console*/

const util = require('util');
const yaml = require('../');


const tags = [ 'scalar', 'sequence', 'mapping' ].map(function (kind) {
  // first argument here is a prefix, so this type will handle anything starting with !
  return new yaml.Type('!', {
    kind: kind,
    multi: true,
    construct: function (data, type) {
      return { type: type, data: data };
    }
  });
});

const SCHEMA = yaml.DEFAULT_SCHEMA.extend(tags);

const data = `
subject: Handling unknown types in JS-YAML
scalar: !unknown_scalar_tag 123
sequence: !unknown_sequence_tag [ 1, 2, 3 ]
mapping: !unknown_mapping_tag { foo: 1, bar: 2 }
`;

const loaded = yaml.load(data, { schema: SCHEMA });
console.log(util.inspect(loaded, false, 20, true));
