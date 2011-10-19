JS.require('JS.Class');


var __ = require('./import')('error', 'tokens', 'events', 'scanner');


var ParserError = exports.ParserError = new JS.Class('ParserError', __.MarkedYAMLError, {});


exports.Parser = new JS.Class('Parser', {
});


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
