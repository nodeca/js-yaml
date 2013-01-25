'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  implicit: [
    require('../type/null'),
    require('../type/bool')
  ]
});
