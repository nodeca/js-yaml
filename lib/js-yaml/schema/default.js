'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./safe')
  ],
  explicit: [
    require('../type/js/undefined'),
    require('../type/js/regexp'),
    require('../type/js/function')
  ]
});
