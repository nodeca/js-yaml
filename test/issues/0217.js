'use strict';


var assert = require('assert');
var yaml   = require('../../');


test('Javascript functions are not folded', function () {
  var doc = yaml.load('"key": !<tag:yaml.org,2002:js/function> "function (){ some_function_call(); ' +
    'and_another_one(); and_another(); and_another(); and_more_and_more(); ' +
    'until_the_line_become_too_long();}"');
  var dump = yaml.dump(doc);
  assert(Math.max.apply(null, dump.split('\n').map(function (str) { return str.length; })) > 80);
});

test('Regular expressions are not folded', function () {
  var doc = yaml.load('"key": !<tag:yaml.org,2002:js/regexp> /It is a very long reular expression. ' +
    'It so so long that it is longer than 80 characters per line./');
  var dump = yaml.dump(doc);
  assert(Math.max.apply(null, dump.split('\n').map(function (str) { return str.length; })) > 80);
});

test('Strings are folded as usual', function () {
  var doc = yaml.load('"key": |\n  It is just a very long string. It should be folded because the dumper ' +
    'fold lines that are exceed limit in 80 characters per line.');
  var dump = yaml.dump(doc);
  assert(Math.max.apply(null, dump.split('\n').map(function (str) { return str.length; })) <= 80);
});
