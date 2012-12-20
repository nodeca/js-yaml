'use strict';

function makePair(key, value) {
  var pair = Object.create(null);
  pair[key] = value;
  return pair;
}

module.exports = {
  'Bestiary': [
    makePair('aardvark', 'African pig-like ant eater. Ugly.'),
    makePair('anteater', 'South-American ant eater. Two species.'),
    makePair('anaconda', 'South-American constrictor snake. Scaly.')
  ],
  'Numbers': [
    makePair('one', 1),
    makePair('two', 2),
    makePair('three', 3)
  ]
};
