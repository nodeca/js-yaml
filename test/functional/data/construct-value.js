'use strict';

module.exports = [
  {
    'link with': [
      'library1.dll',
      'library2.dll'
    ]
  },
  {
    'link with': [
      { '=': 'library1.dll', 'version': 1.2 },
      { '=': 'library2.dll', 'version': 2.3 }
    ],
  }
];
