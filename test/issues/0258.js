'use strict';


const assert = require('assert');
const yaml = require('../../');


it('should shorthand tags with !! whenever possible', function () {
  let regexp = new yaml.Type('tag:yaml.org,2002:js/regexp', {
    kind: 'scalar',
    resolve: () => true,
    construct: str => new RegExp(str),
    instanceOf: RegExp,
    represent: object => object.source
  });

  let schema = yaml.DEFAULT_SCHEMA.extend(regexp);

  let source = 're: !!js/regexp .*\n';

  let object = yaml.load(source, { schema });
  assert(object.re instanceof RegExp);

  let str = yaml.dump(object, { schema });
  assert.strictEqual(str, source);
});
