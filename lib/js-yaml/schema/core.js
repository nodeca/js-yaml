'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  implicit: [
    require('../type/null'),
    require('../type/bool'),
    require('../type/int'),
    require('../type/float')
  ],
  explicit: [
    require('../type/timestamp'),
    require('../type/binary'),
    require('../type/omap')
  ]
});
