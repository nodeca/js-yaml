'use strict';

var assert = require('assert');
var yaml = require('../..');

test('should not unnecessaryly apply quotes', function () {

  var expected = 'url: https://github.com/nodeca/js-yaml\n';
  var actual = yaml.dump(
    {
      url: 'https://github.com/nodeca/js-yaml'
    }
  );

  assert.strictEqual(actual, expected);
});
test('should not unnecessaryly apply quotes - ', function () {

  var expected = 'url: https://github.com/nodeca/js-yaml\n';

  var obj = {};
  obj['url'] = 'https://github.com/nodeca/js-yaml';

  var actual = yaml.dump(obj);

  assert.strictEqual(actual, expected);
});

test('should not unnecessaryly apply quotes - space then /\n at end of value', function () {

  var expected = 'url: \'https://github.com/nodeca/js-yaml \'\n';

  var obj = {};
  obj['url'] = 'https://github.com/nodeca/js-yaml ';

  var actual = yaml.dump(obj);

  assert.strictEqual(actual, expected);
});
test('should not unnecessaryly apply quotes - space after colon', function () {

  var expected = 'url: \'https: //github.com/nodeca/js-yaml\'\n';
  var actual = yaml.dump({ url: 'https: //github.com/nodeca/js-yaml' });

  assert.strictEqual(actual, expected);
});
