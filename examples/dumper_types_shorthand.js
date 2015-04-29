'use strict';

/*eslint-disable no-console*/

var fs   = require('fs');
var path = require('path');
var util = require('util');
var yaml = require('../lib/js-yaml');

// reuse custom types example
var Point = require('./custom_types.js').Point;
var SPACE_SCHEMA = require('./custom_types.js').SPACE_SCHEMA;

// sample data
var data = [
  new Point(1, 2, 3),
  {
    another_point: new Point(1.1, 2.1, 3.1),
    additional_points: [
      new Point(4, 5, 6),
      new Point(7, 8, 9)
    ]
  },
  /.*/g
];

// dump data
var dumpWithShorthands = yaml.dump(data, {
  // dumper uses the custome scheme
  schema: SPACE_SCHEMA,
  // make dumper print shorthand notation
  // http://www.yaml.org/spec/1.2/spec.html#tag/shorthand/
  shorthandTags: true,
  flowLevel: 2
});

console.log(dumpWithShorthands);

// output:
// - !point
//   - 1
//   - 2
//   - 3
// - another_point: !point [1.1, 2.1, 3.1]
//   additional_points: [!point [4, 5, 6], !point [7, 8, 9]]
// - !<tag:yaml.org,2002:js/regexp> '/.*/g'

var defaultDump = yaml.dump(data, {
  // dumper uses the custome scheme
  schema: SPACE_SCHEMA,
  // make dumper print shorthand notation
  // http://www.yaml.org/spec/1.2/spec.html#tag/shorthand/
  shorthandTags: false, // default
  flowLevel: 2
});

console.log(defaultDump);

// output:
// - !<!point>
//   - 1
//   - 2
//   - 3
// - another_point: !<!point> [1.1, 2.1, 3.1]
//   additional_points: [!<!point> [4, 5, 6], !<!point> [7, 8, 9]]
// - !<tag:yaml.org,2002:js/regexp> '/.*/g'
