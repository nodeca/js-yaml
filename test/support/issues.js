'use strict';
/*global it:false */


var path = require('path');
var assert = require('assert');
var _common = require('./common');


var DATA_DIRECTORY = process.env['JSYAML_ISSUES_TEST_DATA'] ?
  path.normalize(process.env['JSYAML_ISSUES_TEST_DATA']) :
  path.join(__dirname, '../issues/data');


function generateTests(issueId, settings) {
  var title       = ('#' + issueId + ': ' + settings.title),
      filename    = ('issue-' + issueId + '.yml'),
      directory   = settings.directory || DATA_DIRECTORY,
      isFixed     = settings.fixed     || false,
      testHandler = settings.test,
      datafile    = new _common.DataFile(path.join(directory, filename));

  it(title, function () {
    var context = this;

    function run() {
      testHandler.call(context, datafile);
    }

    if (isFixed) {
      run();
    } else {
      assert.throws(run);
    }
  });
}


module.exports.DATA_DIRECTORY = DATA_DIRECTORY;
module.exports.generateTests = generateTests;
