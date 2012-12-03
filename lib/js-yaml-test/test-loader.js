'use strict';


var _reader = require('../js-yaml/reader');
var _scanner = require('../js-yaml/scanner');
var _parser = require('../js-yaml/parser');
var _composer = require('../js-yaml/composer');
var _resolver = require('../js-yaml/resolver');

var $$$ = require('./common');
var TestConstructor = require('./test-constructor');


function TestLoader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  TestConstructor.call(this);
  _resolver.Resolver.call(this);
}

$$$.extend(TestLoader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         TestConstructor.prototype,
         _resolver.Resolver.prototype);


module.exports = TestLoader;
