'use strict';


var Schema = require('../schema');
var core   = require('./core');


module.exports = new Schema({
  include: [ core ],
  explicit: [
    require('../type/js/undefined'),
    require('../type/js/regexp')
  ]
});
