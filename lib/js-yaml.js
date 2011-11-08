'use strict';


var fs = require('fs'),
    _loader = require('./js-yaml/loader');


var jsyaml = module.exports = {};


jsyaml.scan = function scan(stream, callback, Loader) {
  var loader = new (Loader || _loader.SafeLoader)(stream);
  while (loader.checkToken()) {
    callback(loader.getToken());
  }
};


jsyaml.compose = function compose(stream, Loader) {
  var loader = new (Loader || _loader.SafeLoader)(stream);
  return loader.getSingleNode();
};


jsyaml.load = function load(stream, Loader) {
  var loader = new (Loader || _loader.SafeLoader)(stream);
  return loader.getSingleData();
};


jsyaml.loadAll = function loadAll(stream, callback, Loader) {
  var loader = new (Loader || _loader.SafeLoader)(stream);

  while (loader.checkData()) {
    callback(loader.getData());
  }
};

// Register extensions handler
(function () {
  var require_handler = function (module, filename) {
    var fd = fs.openSync(filename, 'r');
    
    // fill in documents
    module.exports = [];
    jsyaml.loadAll(fd, function (doc) { module.exports.push(doc); });

    fs.closeSync(fd);
  };

  // register require extensions only if we're on node.js
  // hack for browserify
  if (undefined !== require.extensions) {
    require.extensions['.yml'] = require_handler;
    require.extensions['.yaml'] = require_handler;
  }
}());


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
