/*!
 * Copyright (C) 2011 by Vitaly Puzrin
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Extend prototypes and native objects for oldIEs, Safaies and Operas

if (!Array.isArray) {
  Array.isArray = function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };
}

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj) {
    var i;
    for (i=0; i < this.length; i++) {
      if (this[i] == obj) {
        return i;
      }
    }
    return -1;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (iterator, context) {
    var i, l;
    context = context || this;
    for (i = 0, l = this.length; i < l; i += 1) {
      iterator.call(context, this[i], i);
    }
  };
}

if (!Function.prototype.bind) {
  Function.prototype.bind = function bind(context) {
    var func = this;
    return function bound() {
      func.apply(context, arguments);
    };
  };
}

if (!Object.getOwnPropertyNames) {
  Object.getOwnPropertyNames = function getOwnPropertyNames(obj) {
    var names = [], key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        names.push(key);
      }
    }
    return names;
  };
}
;var jsyaml = (function () {
  var __jsyaml__ = (function () {
var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/lib/js-yaml.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var fs = require('fs');
var _loader = require('./js-yaml/loader');


var jsyaml = module.exports = {};


jsyaml.scan = function scan(stream, callback, Loader) {
  Loader = (Loader || _loader.SafeLoader);

  var loader = new Loader(stream);
  while (loader.checkToken()) {
    callback(loader.getToken());
  }
};


jsyaml.compose = function compose(stream, Loader) {
  Loader = (Loader || _loader.SafeLoader);

  var loader = new Loader(stream);
  return loader.getSingleNode();
};


jsyaml.load = function load(stream, Loader) {
  Loader = (Loader || _loader.Loader);

  var loader = new Loader(stream);
  return loader.getSingleData();
};


jsyaml.loadAll = function loadAll(stream, callback, Loader) {
  Loader = (Loader || _loader.Loader);

  var loader = new Loader(stream);
  while (loader.checkData()) {
    callback(loader.getData());
  }
};


jsyaml.safeLoad = function load(stream) {
  return jsyaml.load(stream, _loader.SafeLoader);
};


jsyaml.safeLoadAll = function loadAll(stream, callback) {
  jsyaml.loadAll(stream, callback, _loader.SafeLoader);
};


/**
 *  jsyaml.addConstructor(tag, constructor[, Loader]) -> Void
 *  Add a constructor for the given tag.
 *
 *  Constructor is a function that accepts a Loader instance
 *  and a node object and produces the corresponding JavaScript object.
 **/
jsyaml.addConstructor = function addConstructor(tag, constructor, Loader) {
  (Loader || _loader.Loader).addConstructor(tag, constructor);
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

});

require.define("fs", function (require, module, exports, __dirname, __filename) {
    // nothing to see here... no file methods for the browser

});

require.define("/lib/js-yaml/loader.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');
var _reader = require('./reader');
var _scanner = require('./scanner');
var _parser = require('./parser');
var _composer = require('./composer');
var _resolver = require('./resolver');
var _constructor = require('./constructor');


function BaseLoader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  _constructor.BaseConstructor.call(this);
  _resolver.BaseResolver.call(this);
}

$$.extend(BaseLoader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _constructor.BaseConstructor.prototype,
         _resolver.BaseResolver.prototype);


function SafeLoader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  _constructor.SafeConstructor.call(this);
  _resolver.Resolver.call(this);
}

$$.extend(SafeLoader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _constructor.SafeConstructor.prototype,
         _resolver.Resolver.prototype);


function Loader(stream) {
  _reader.Reader.call(this, stream);
  _scanner.Scanner.call(this);
  _parser.Parser.call(this);
  _composer.Composer.call(this);
  _constructor.Constructor.call(this);
  _resolver.Resolver.call(this);
}

$$.extend(Loader.prototype,
         _reader.Reader.prototype,
         _scanner.Scanner.prototype,
         _parser.Parser.prototype,
         _composer.Composer.prototype,
         _constructor.Constructor.prototype,
         _resolver.Resolver.prototype);


module.exports.BaseLoader = BaseLoader;
module.exports.SafeLoader = SafeLoader;
module.exports.Loader = Loader;

////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/common.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = module.exports = {};


// UTILITY METHODS
////////////////////////////////////////////////////////////////////////////////


// <object> $$.extend(receiver, *sources)
//
// Copy all of the properties in the source objects over to the target object.
// It's in-order, so the last source will override properties of the same name
// in previous arguments.
//
// Example: var o = $$.extend({}, a, b, c);
$$.extend = function extend(receiver) {
  var i, l, key, skip = [];

  receiver = receiver || {};
  l = arguments.length;

  if (!!arguments[l - 1] && !!arguments[l - 1].except) {
    skip = arguments[l - 1].except;
    l -= 1;
  }

  for (i = 1; i < l; i += 1) {
    if (!!arguments[i] && 'object' === typeof arguments[i]) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key) && -1 === skip.indexOf(key)) {
          receiver[key] = arguments[i][key];
        }
      }
    }
  }

  return receiver;
};


// simple inheritance algorithm
$$.inherits = function inherits(child, parent) {
  var InheritanceGlue = function () {};

  InheritanceGlue.prototype = parent.prototype;
  child.prototype = new InheritanceGlue();

  // copy parent prototype' methods into child, so mixing made possible
  // think of it as of caching of parent's prototype methods in child
  $$.extend(child.prototype, parent.prototype, {except: [
    'arguments', 'length', 'name', 'prototype', 'caller'
  ]});

  // restore constructor
  $$.extend(child.prototype, {constructor: child});

  child.__parent__ = parent;
};


// wrapper for instanceof that allows to check inheritance after $$.inherits
$$.isInstanceOf = function isInstanceOf(obj, klass) {
  var parent;

  if (obj instanceof klass) {
    return true;
  }

  if (!!obj && !!obj.constructor) {
    parent = obj.constructor.__parent__;
    return (parent === klass || $$.isInstanceOf(parent, klass));
  }

  return false;
};


// iterates through all object keys-value pairs calling iterator on each one
// example: $$.each(objOrArr, function (val, key) { /* ... */ });
$$.each = function each(obj, iterator, context) {
  var keys, i, l;

  if (null === obj || undefined === obj) {
    return;
  }

  context = context || iterator;

  if (obj.forEach === Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else {
    keys = Object.getOwnPropertyNames(obj);
    for (i = 0, l = keys.length; i < l; i += 1) {
      iterator.call(context, obj[keys[i]], keys[i], obj);
    }
  }
};


// returns reversed copy of array
$$.reverse = function reverse(arr) {
  var result = [], i, l;
  for (i = 0, l = arr.length; i < l; i += 1) {
    result.unshift(arr[i]);
  }
  return result;
};


// Modified from:
// https://raw.github.com/kanaka/noVNC/d890e8640f20fba3215ba7be8e0ff145aeb8c17c/include/base64.js
$$.decodeBase64 = (function () {
  var padding = '=', binTable = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,  0, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
  ];

  return function decode(data) {
    var value, code, idx = 0, result = [], leftbits, leftdata;

    leftbits = 0; // number of bits decoded, but yet to be appended
    leftdata = 0; // bits decoded, but yet to be appended

    // Convert one by one.
    for (idx = 0; idx < data.length; idx += 1) {
      code = data.charCodeAt(idx);
      value = binTable[code & 0x7F];

      // Skip LF(NL) || CR
      if (0x0A !== code && 0x0D !== code) {
        // Fail on illegal characters
        if (-1 === value) {
          throw new Error("Illegal characters (code=" + code + ") in position " +
                          idx + ": ordinal not in range(0..128)");
        }

        // Collect data into leftdata, update bitcount
        leftdata = (leftdata << 6) | value;
        leftbits += 6;

        // If we have 8 or more bits, append 8 bits to the result
        if (leftbits >= 8) {
          leftbits -= 8;
          // Append if not padding.
          if (padding !== data.charAt(idx)) {
            result.push((leftdata >> leftbits) & 0xFF);
          }
          leftdata &= (1 << leftbits) - 1;
        }
      }
    }

    // If there are any bits left, the base64 string was corrupted
    if (leftbits) {
      throw new Error("Corrupted base64 string");
    }

    return new Buffer(result);
  };
}());


// CLASSES
////////////////////////////////////////////////////////////////////////////////


// Dummy alternative of delayed population based on generators in PyYAML
$$.Populator = function Populator(data, callback, context) {
  if (!(this instanceof $$.Populator)) {
    return new $$.Populator(data, callback, context);
  }

  this.data = data;
  this.execute = function () {
    callback.call(context || callback);
  };
};


// Simple implementation of hashtable
$$.Hash = function Hash(defaultValue) {
  var keys, values, index;

  if (!(this instanceof $$.Hash)) {
    return new $$.Hash(defaultValue);
  }

  index = 0;
  keys = [];
  values = [];

  this.store = function store(key, value) {
    var i = keys.indexOf(key);

    if (0 <= i) {
      values[i] = value;
      return;
    }

    i = index;
    index += 1;

    keys[i] = key;
    values[i] = value;
  };


  this.remove = function remove(key) {
    var i = keys.indexOf(key);

    if (0 <= i) {
      delete keys[i];
      delete values[i];
    }
  };


  this.hasKey = function hasKey(key) {
    return 0 <= keys.indexOf(key);
  };


  this.get = function get(key) {
    var i = keys.indexOf(key);
    return (0 <= i) ? values[i] : defaultValue;
  };
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/reader.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var fs = require('fs');
var $$ = require('./common');
var _errors = require('./errors');


// "\x20-\x7E" -> " -~" for JSLint
var NON_PRINTABLE = new RegExp('[^\x09\x0A\x0D -~\x85\xA0-\uD7FF\uE000-\uFFFD]');


function ReaderError(name, position, character, encoding, reason) {
  _errors.YAMLError.apply(this);
  this.name = 'ReaderError';

  this.name = name;
  this.position = position;
  this.character = character;
  this.encoding = encoding;
  this.reason = reason;

  this.toString = function toString() {
    return 'unacceptable character ' + this.character + ': ' + this.reason +
      '\n in "' + this.name + '", position ' + this.position;
  };
}
$$.inherits(ReaderError, _errors.YAMLError);


function Reader(stream) {
  this.name = '<unicode string>';
  this.stream = null;
  this.streamPointer = 0;
  this.eof = true;
  this.buffer = '';
  this.pointer = 0;
  this.rawBuffer = null;
  this.encoding = 'utf-8';
  this.index = 0;
  this.line = 0;
  this.column = 0;

  if ('string' === typeof stream) { // simple string
    this.name = '<unicode string>';
    this.checkPrintable(stream);
    this.buffer = stream + '\x00';
  } else if (Buffer.isBuffer(stream)) { // buffer
    this.name = '<buffer>';
    this.rawBuffer = stream;
    this.update(1);
  } else { // file descriptor
    this.name = '<file>';
    this.stream = stream;
    this.eof = false;
    this.updateRaw();
    this.update(1);
  }
}

Reader.prototype.peek = function peek(index) {
  var data;

  index = +index || 0;
  data =  this.buffer[this.pointer + index];

  if (undefined === data) {
    this.update(index + 1);
    data = this.buffer[this.pointer + index];
  }

  return data;
};

Reader.prototype.prefix = function prefix(length) {
  length = +length || 1;
  if (this.pointer + length >= this.buffer.length) {
    this.update(length);
  }
  return this.buffer.slice(this.pointer, this.pointer + length);
};

Reader.prototype.forward = function forward(length) {
  var ch;

  // WARNING!!! length default is <int:1>, but method cn be called with
  //            <int:0> which is absolutely NOT default length value, so
  //            that's why we have ternary operator instead of lazy assign.
  length = (undefined !== length) ? (+length) : 1;

  if (this.pointer + length + 1 >= this.buffer.length) {
    this.update(length + 1);
  }

  while (length) {
    ch = this.buffer[this.pointer];
    this.pointer += 1;
    this.index += 1;

    if (0 <= '\n\x85\u2028\u2029'.indexOf(ch)
        || ('\r' === ch && '\n' !== this.buffer[this.pointer])) {
      this.line += 1;
      this.column = 0;
    } else if (ch !== '\uFEFF') {
      this.column += 1;
    }

    length -= 1;
  }
};

Reader.prototype.getMark = function getMark() {
  if (null === this.stream) {
    return new _errors.Mark(this.name, this.index, this.line, this.column,
                       this.buffer, this.pointer);
  } else {
    return new _errors.Mark(this.name, this.index, this.line, this.column,
                       null, null);
  }
};


Reader.prototype.checkPrintable = function checkPrintable(data) {
  var match = data.toString().match(NON_PRINTABLE), position;
  if (match) {
    position = this.index + this.buffer.length - this.pointer + match.index;
    throw new ReaderError(this.name, position, match[0],
                          'unicode', 'special characters are not allowed');
  }
};

Reader.prototype.update = function update(length) {
  var data;

  if (null === this.rawBuffer) {
    return;
  }

  this.buffer = this.buffer.slice(this.pointer);
  this.pointer = 0;

  while (this.buffer.length < length) {
    if (!this.eof) {
      this.updateRaw();
    }

    data = this.rawBuffer;

    this.checkPrintable(data);
    this.buffer += data;
    this.rawBuffer = this.rawBuffer.slice(data.length);

    if (this.eof) {
      this.buffer += '\x00';
      this.rawBuffer = null;
      break;
    }
  }
};

Reader.prototype.updateRaw = function updateRaw(size) {
  var data = new Buffer(+size || 4096), count, tmp;

  count = fs.readSync(this.stream, data, 0, data.length);

  if (null === this.rawBuffer) {
    this.rawBuffer = data.slice(0, count);
  } else {
    tmp = new Buffer(this.rawBuffer.length + count);
    this.rawBuffer.copy(tmp);
    data.copy(tmp, this.rawBuffer.length);
    this.rawBuffer = tmp;
  }

  this.streamPointer += count;

  if (!count || count < data.length) {
    this.eof = true;
  }
};



module.exports.Reader = Reader;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/errors.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');


var repeat = function repeat(str, n) {
  var result = '', i;
  for (i = 0; i < n; i += 1) {
    result += str;
  }
  return result;
};


function Mark(name, index, line, column, buffer, pointer) {
  this.name = name;
  this.index = index;
  this.line = line;
  this.column = column;
  this.buffer = buffer;
  this.pointer = pointer;
}

Mark.prototype.getSnippet = function (indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) {
    return null;
  }

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.pointer;

  while (start > 0 && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer[start - 1])) {
    start -= 1;
    if (this.pointer - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.pointer;

  while (end < this.buffer.length && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer[end])) {
    end += 1;
    if (end - this.pointer > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return repeat(' ', indent) + head + snippet + tail + '\n' +
    repeat(' ', indent + this.pointer - start + head.length) + '^';
};

Mark.prototype.toString = function () {
  var snippet = this.getSnippet(), where;

  where = ' in "' + this.name +
    '", line ' + (this.line + 1) +
    ', column ' + (this.column + 1);

  if (snippet) {
    where += ':\n' + snippet;
  }

  return where;
};


function YAMLError(message) {
  $$.extend(this, Error.prototype.constructor.call(this, message));
  this.name = 'YAMLError';
}
$$.inherits(YAMLError, Error);


function MarkedYAMLError(context, contextMark, problem, problemMark, note) {
  YAMLError.call(this);
  this.name = 'MarkedYAMLError';

  this.context = context || null;
  this.contextMark = contextMark || null;
  this.problem = problem || null;
  this.problemMark = problemMark || null;
  this.note = note || null;

  this.toString = function toString() {
    var lines = [];

    if (null !== this.context) {
      lines.push(this.context);
    }

    if (null !== this.contextMark
        && (null === this.problem || null === this.problemMark
            || this.contextMark.name !== this.problemMark.name
            || this.contextMark.line !== this.problemMark.line
            || this.contextMark.column !== this.problemMark.column)) {
      lines.push(this.contextMark.toString());
    }

    if (null !== this.problem) {
      lines.push(this.problem);
    }

    if (null !== this.problemMark) {
      lines.push(this.problemMark.toString());
    }

    if (null !== this.note) {
      lines.push(this.note);
    }

    return lines.join('\n');
  };
}
$$.inherits(MarkedYAMLError, YAMLError);


module.exports.Mark = Mark;
module.exports.YAMLError = YAMLError;
module.exports.MarkedYAMLError = MarkedYAMLError;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/scanner.js", function (require, module, exports, __dirname, __filename) {
    // Scanner produces tokens of the following types:
//
// STREAM-START
// STREAM-END
// DIRECTIVE(name, value)
// DOCUMENT-START
// DOCUMENT-END
// BLOCK-SEQUENCE-START
// BLOCK-MAPPING-START
// BLOCK-END
// FLOW-SEQUENCE-START
// FLOW-MAPPING-START
// FLOW-SEQUENCE-END
// FLOW-MAPPING-END
// BLOCK-ENTRY
// FLOW-ENTRY
// KEY
// VALUE
// ALIAS(value)
// ANCHOR(value)
// TAG(value)
// SCALAR(value, plain, style)
// 
// Read comments in the Scanner code for more details.


'use strict';


var $$ = require('./common');
var _errors = require('./errors');
var _tokens = require('./tokens');


var ESCAPE_REPLACEMENTS = {
  '0':    '\x00',
  'a':    '\x07',
  'b':    '\x08',
  't':    '\x09',
  '\t':   '\x09',
  'n':    '\x0A',
  'v':    '\x0B',
  'f':    '\x0C',
  'r':    '\x0D',
  'e':    '\x1B',
  ' ':    ' ', // \x20, but JSLint against it :))
  '\"':   '\"',
  '\\':   '\\',
  'N':    '\x85',
  '_':    '\xA0',
  'L':    '\u2028',
  'P':    '\u2029'
};

var ESCAPE_CODES = {
  'x':    2,
  'u':    4,
  'U':    8
};

var range = function (start, count) {
  var result = [];

  if (undefined === count) {
    count = start;
    start = 0;
  }

  while (0 < count) {
    result.push(start);
    count -= 1;
    start += 1;
  }

  return result;
};


function ScannerError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ScannerError';
}
$$.inherits(ScannerError, _errors.MarkedYAMLError);


// See below simple keys treatment.
function SimpleKey(tokenNumber, required, index, line, column, mark) {
  this.tokenNumber = tokenNumber;
  this.required = required;
  this.index = index;
  this.line = line;
  this.column = column;
  this.mark = mark;
}


function Scanner() {
  // It is assumed that Scanner and Reader will have a common descendant.
  // Reader do the dirty work of checking for BOM and converting the
  // input data to Unicode. It also adds NUL to the end.
  //
  // Reader supports the following methods
  //   this.peek(i=0)       # peek the next i-th character
  //   this.prefix(l=1)     # peek the next l characters
  //   this.forward(l=1)    # read the next l characters and move the pointer.

  // Had we reached the end of the stream?
  this.done = false;

  // The number of unclosed '{' and '['. `flowLevel == 0` means block
  // context.
  this.flowLevel = 0;

  // List of processed tokens that are not yet emitted.
  this.tokens = [];

  // Add the STREAM-START token.
  this.fetchStreamStart();

  // Number of tokens that were emitted through the `getToken` method.
  this.tokensTaken = 0;

  // The current indentation level.
  this.indent = -1;

  // Past indentation levels.
  this.indents = [];

  // Variables related to simple keys treatment.

  // A simple key is a key that is not denoted by the '?' indicator.
  // Example of simple keys:
  //   ---
  //   block simple key: value
  //   ? not a simple key:
  //   : { flow simple key: value }
  // We emit the KEY token before all keys, so when we find a potential
  // simple key, we try to locate the corresponding ':' indicator.
  // Simple keys should be limited to a single line and 1024 characters.

  // Can a simple key start at the current position? A simple key may
  // start:
  // - at the beginning of the line, not counting indentation spaces
  //       (in block context),
  // - after '{', '[', ',' (in the flow context),
  // - after '?', ':', '-' (in the block context).
  // In the block context, this flag also signifies if a block collection
  // may start at the current position.
  this.allowSimpleKey = true;

  // Keep track of possible simple keys. This is a dictionary. The key
  // is `flowLevel`; there can be no more that one possible simple key
  // for each level. The value is a SimpleKey record:
  //   (tokenNumber, required, index, line, column, mark)
  // A simple key may start with ALIAS, ANCHOR, TAG, SCALAR(flow),
  // '[', or '{' tokens.
  this.possibleSimpleKeys = {};
}

Scanner.prototype.checkToken = function checkToken() {
  var i;

  while (this.needMoreTokens()) {
    this.fetchMoreTokens();
  }

  if (this.tokens.length) {
    if (!arguments.length) {
      return true;
    }

    for (i = 0; i < arguments.length; i += 1) {
      if ($$.isInstanceOf(this.tokens[0], arguments[i])) {
        return true;
      }
    }
  }

  return false;
};

Scanner.prototype.peekToken = function peekToken() {
  // Return the next token, but do not delete if from the queue.

  while (this.needMoreTokens()) {
    this.fetchMoreTokens();
  }

  if (this.tokens.length) {
    return this.tokens[0];
  }

  return null;
};

Scanner.prototype.getToken = function getToken() {
  var token = null;

  // Return the next token.

  while (this.needMoreTokens()) {
    this.fetchMoreTokens();
  }

  if (this.tokens.length) {
    this.tokensTaken += 1;
    token = this.tokens.shift();
  }

  return token;
};

Scanner.prototype.needMoreTokens = function needMoreTokens() {
  if (this.done) {
    return false;
  }

  if (!this.tokens.length) {
    return true;
  }

  // The current token may be a potential simple key, so we
  // need to look further.

  this.stalePossibleSimpleKeys();
  if (this.nextPossibleSimpleKey() === this.tokensTaken) {
    return true;
  }

  return false;
};

Scanner.prototype.fetchMoreTokens = function fetchMoreTokens() {
  var ch;

  // Eat whitespaces and comments until we reach the next token.
  this.scanToNextToken();

  // Remove obsolete possible simple keys.
  this.stalePossibleSimpleKeys();

  // Compare the current indentation and column. It may add some tokens
  // and decrease the current indentation level.
  this.unwindIndent(this.column);

  // Peek the next character.
  ch = this.peek();

  // Is it the end of stream?
  if (ch === '\x00') {
    return this.fetchStreamEnd();
  }

  // Is it a directive?
  if (ch === '%' && this.checkDirective()) {
    return this.fetchDirective();
  }

  // Is it the document start?
  if (ch === '-' && this.checkDocumentStart()) {
    return this.fetchDocumentStart();
  }

  // Is it the document end?
  if (ch === '.' && this.checkDocumentEnd()) {
    return this.fetchDocumentEnd();
  }

  // Note: the order of the following checks is NOT significant.

  // Is it the flow sequence start indicator?
  if (ch === '[') {
    return this.fetchFlowSequenceStart();
  }

  // Is it the flow mapping start indicator?
  if (ch === '{') {
    return this.fetchFlowMappingStart();
  }

  // Is it the flow sequence end indicator?
  if (ch === ']') {
    return this.fetchFlowSequenceEnd();
  }

  // Is it the flow mapping end indicator?
  if (ch === '}') {
    return this.fetchFlowMappingEnd();
  }

  // Is it the flow entry indicator?
  if (ch === ',') {
    return this.fetchFlowEntry();
  }

  // Is it the block entry indicator?
  if (ch === '-' && this.checkBlockEntry()) {
    return this.fetchBlockEntry();
  }

  // Is it the key indicator?
  if (ch === '?' && this.checkKey()) {
    return this.fetchKey();
  }

  // Is it the value indicator?
  if (ch === ':' && this.checkValue()) {
    return this.fetchValue();
  }

  // Is it an alias?
  if (ch === '*') {
    return this.fetchAlias();
  }

  // Is it an anchor?
  if (ch === '&') {
    return this.fetchAnchor();
  }

  // Is it a tag?
  if (ch === '!') {
    return this.fetchTag();
  }

  // Is it a literal scalar?
  if (ch === '|' && !this.flowLevel) {
    return this.fetchLiteral();
  }

  // Is it a folded scalar?
  if (ch === '>' && !this.flowLevel) {
    return this.fetchFolded();
  }

  // Is it a single quoted scalar?
  if (ch === '\'') {
    return this.fetchSingle();
  }

  // Is it a double quoted scalar?
  if (ch === '\"') {
    return this.fetchDouble();
  }

  // It must be a plain scalar then.
  if (this.checkPlain()) {
    return this.fetchPlain();
  }

  // No? It's an error. Let's produce a nice error message.
  throw new ScannerError("while scanning for the next token", null,
                         "found character " + ch + " that cannot start any token",
                         this.getMark());
};

Scanner.prototype.nextPossibleSimpleKey = function nextPossibleSimpleKey() {
  var minTokenNumber = null;

  // Return the number of the nearest possible simple key. Actually we
  // don't need to loop through the whole dictionary. We may replace it
  // with the following code:
  //   if (!this.possibleSimpleKeys.langth) {
  //     return null;
  //   }
  //   return this.possibleSimpleKeys[
  //     Math.min.apply({}, this.possibleSimpleKeys.keys())
  //   ].tokenNumber;

  $$.each(this.possibleSimpleKeys, function (key) {
    if (null === minTokenNumber || key.tokenNumber < minTokenNumber) {
      minTokenNumber = key.tokenNumber;
    }
  });

  return minTokenNumber;
};

Scanner.prototype.stalePossibleSimpleKeys = function stalePossibleSimpleKeys() {
  // Remove entries that are no longer possible simple keys. According to
  // the YAML specification, simple keys
  // - should be limited to a single line,
  // - should be no longer than 1024 characters.
  // Disabling this procedure will allow simple keys of any length and
  // height (may cause problems if indentation is broken though).
  $$.each(this.possibleSimpleKeys, function (key, level) {
    if (key.line !== this.line || 1024 < (this.index - key.index)) {
      if (key.required) {
        throw new ScannerError("while scanning a simple key", key.mark,
                               "could not found expected ':'", this.getMark());
      }
      delete this.possibleSimpleKeys[level];
    }
  }, this);
};

Scanner.prototype.savePossibleSimpleKey = function savePossibleSimpleKey() {
  var required, tokenNumber, key;

  // The next token may start a simple key. We check if it's possible
  // and save its position. This function is called for
  //   ALIAS, ANCHOR, TAG, SCALAR(flow), '[', and '{'.

  // Check if a simple key is required at the current position.
  required = (!this.flowLevel && this.indent === this.column);

  // A simple key is required only if it is the first token in the current
  // line. Therefore it is always allowed.
  if (!this.allowSimpleKey && required) {
    throw new _errors.YAMLError('Simple key is required');
  }

  // The next token might be a simple key. Let's save it's number and
  // position.
  if (this.allowSimpleKey) {
    this.removePossibleSimpleKey();
    tokenNumber = this.tokensTaken + this.tokens.length;
    key = new SimpleKey(tokenNumber, required, this.index, this.line,
                        this.column, this.getMark());
    this.possibleSimpleKeys[this.flowLevel] = key;
  }
};

Scanner.prototype.removePossibleSimpleKey = function removePossibleSimpleKey() {
  var key;

  // Remove the saved possible key position at the current flow level.

  if (undefined !== this.possibleSimpleKeys[this.flowLevel]) {
    key = this.possibleSimpleKeys[this.flowLevel];

    if (key.required) {
       throw new ScannerError("while scanning a simple key", key.mark,
                              "could not found expected ':'", this.getMark());
    }

    delete this.possibleSimpleKeys[this.flowLevel];
  }
};

Scanner.prototype.unwindIndent = function unwindIndent(column) {
  var mark;

  // In flow context, tokens should respect indentation.
  // Actually the condition should be `self.indent >= column` according to
  // the spec. But this condition will prohibit intuitively correct
  // constructions such as
  //   key : {
  //   }
  //  if self.flow_level and self.indent > column:
  //    raise ScannerError(None, None,
  //            "invalid intendation or unclosed '[' or '{'",
  //            self.get_mark())

  // In the flow context, indentation is ignored. We make the scanner less
  // restrictive then specification requires.

  if (this.flowLevel) {
    return;
  }

  // In block context, we may need to issue the BLOCK-END tokens.
  while (this.indent > column) {
    mark = this.getMark();
    this.indent = this.indents.pop();
    this.tokens.push(new _tokens.BlockEndToken(mark, mark));
  }
};

Scanner.prototype.addIndent = function addIndent(column) {
  // Check if we need to increase indentation.

  if (this.indent < column) {
    this.indents.push(this.indent);
    this.indent = column;
    return true;
  }

  return false;
};

Scanner.prototype.fetchStreamStart = function fetchStreamStart() {
  var mark;

  // We always add STREAM-START as the first token and STREAM-END as the
  // last token.

  // Read the token.
  mark = this.getMark();
  
  // Add STREAM-START.
  this.tokens.push(new _tokens.StreamStartToken(mark, mark, this.encoding));
};

Scanner.prototype.fetchStreamEnd = function fetchStreamEnd() {
  var mark;

  // Set the current intendation to -1.
  this.unwindIndent(-1);

  // Reset simple keys.
  this.removePossibleSimpleKey();
  this.allowSimpleKey = false;
  this.possibleSimpleKeys = {};

  // Read the token.
  mark = this.getMark();
  
  // Add STREAM-END.
  this.tokens.push(new _tokens.StreamEndToken(mark, mark));

  // The steam is finished.
  this.done = true;
};

Scanner.prototype.fetchDirective = function fetchDirective() {
  // Set the current intendation to -1.
  this.unwindIndent(-1);

  // Reset simple keys.
  this.removePossibleSimpleKey();
  this.allowSimpleKey = false;

  // Scan and add DIRECTIVE.
  this.tokens.push(this.scanDirective());
};

Scanner.prototype.fetchDocumentStart = function fetchDocumentStart() {
  this.fetchDocumentIndicator(_tokens.DocumentStartToken);
};

Scanner.prototype.fetchDocumentEnd = function fetchDocumentEnd() {
  this.fetchDocumentIndicator(_tokens.DocumentEndToken);
};

Scanner.prototype.fetchDocumentIndicator = function fetchDocumentIndicator(TokenClass) {
  var startMark, endMark;

  // Set the current intendation to -1.
  this.unwindIndent(-1);

  // Reset simple keys. Note that there could not be a block collection
  // after '---'.
  this.removePossibleSimpleKey();
  this.allowSimpleKey = false;

  // Add DOCUMENT-START or DOCUMENT-END.
  startMark = this.getMark();
  this.forward(3);
  endMark = this.getMark();

  this.tokens.push(new TokenClass(startMark, endMark));
};

Scanner.prototype.fetchFlowSequenceStart = function fetchFlowSequenceStart() {
  this.fetchFlowCollectionStart(_tokens.FlowSequenceStartToken);
};

Scanner.prototype.fetchFlowMappingStart = function fetchFlowMappingStart() {
  this.fetchFlowCollectionStart(_tokens.FlowMappingStartToken);
};

Scanner.prototype.fetchFlowCollectionStart = function fetchFlowCollectionStart(TokenClass) {
  var startMark, endMark;

  // '[' and '{' may start a simple key.
  this.savePossibleSimpleKey();

  // Increase the flow level.
  this.flowLevel += 1;

  // Simple keys are allowed after '[' and '{'.
  this.allowSimpleKey = true;

  // Add FLOW-SEQUENCE-START or FLOW-MAPPING-START.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new TokenClass(startMark, endMark));
};

Scanner.prototype.fetchFlowSequenceEnd = function fetchFlowSequenceEnd() {
  this.fetchFlowCollectionEnd(_tokens.FlowSequenceEndToken);
};

Scanner.prototype.fetchFlowMappingEnd = function fetchFlowMappingEnd() {
  this.fetchFlowCollectionEnd(_tokens.FlowMappingEndToken);
};

Scanner.prototype.fetchFlowCollectionEnd = function fetchFlowCollectionEnd(TokenClass) {
  var startMark, endMark;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Decrease the flow level.
  this.flowLevel -= 1;

  // No simple keys after ']' or '}'.
  this.allowSimpleKey = false;

  // Add FLOW-SEQUENCE-END or FLOW-MAPPING-END.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();
  this.tokens.push(new TokenClass(startMark, endMark));
};

Scanner.prototype.fetchFlowEntry = function fetchFlowEntry() {
  var startMark, endMark;

  // Simple keys are allowed after ','.
  this.allowSimpleKey = true;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Add FLOW-ENTRY.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.FlowEntryToken(startMark, endMark));
};

Scanner.prototype.fetchBlockEntry = function fetchBlockEntry() {
  var mark, startMark, endMark;

  // Block context needs additional checks.
  if (!this.flowLevel) {
    // Are we allowed to start a new entry?
    if (!this.allowSimpleKey) {
      throw new ScannerError(null, null,
                             "sequence entries are not allowed here",
                             this.getMark());
    }

    // We may need to add BLOCK-SEQUENCE-START.
    if (this.addIndent(this.column)) {
      mark = this.getMark();
      this.tokens.push(new _tokens.BlockSequenceStartToken(mark, mark));
    }
  }

  // else --------------------------------------------------------------------
  // It's an error for the block entry to occur in the flow context,
  // but we let the parser detect this.
  // -------------------------------------------------------------------------

  // Simple keys are allowed after '-'.
  this.allowSimpleKey = true;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Add BLOCK-ENTRY.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.BlockEntryToken(startMark, endMark));
};

Scanner.prototype.fetchKey = function fetchKey() {
  var mark, startMark, endMark;

  // Block context needs additional checks.
  if (!this.flowLevel) {
    // Are we allowed to start a key (not nessesary a simple)?
    if (!this.allowSimpleKey) {
      throw new ScannerError(null, null,
                             "mapping keys are not allowed here",
                             this.getMark());
    }

    // We may need to add BLOCK-MAPPING-START.
    if (this.addIndent(this.column)) {
      mark = this.getMark();
      this.tokens.push(new _tokens.BlockMappingStartToken(mark, mark));
    }
  }

  // Simple keys are allowed after '?' in the block context.
  this.allowSimpleKey = !this.flowLevel;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Add KEY.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.KeyToken(startMark, endMark));
};

Scanner.prototype.fetchValue = function fetchValue() {
  var key, mark, startMark, endMark;

  // Do we determine a simple key?
  if (undefined !== this.possibleSimpleKeys[this.flowLevel]) {
      // Add KEY.
      key = this.possibleSimpleKeys[this.flowLevel];
      delete this.possibleSimpleKeys[this.flowLevel];

      this.tokens.splice(key.tokenNumber - this.tokensTaken, 0,
                         new _tokens.KeyToken(key.mark, key.mark));

      // If this key starts a new block mapping, we need to add
      // BLOCK-MAPPING-START.
      if (!this.flowLevel) {
        if (this.addIndent(key.column)) {
          this.tokens.splice(key.tokenNumber - this.tokensTaken, 0,
                             new _tokens.BlockMappingStartToken(key.mark, key.mark));
        }
      }

      // There cannot be two simple keys one after another.
      this.allowSimpleKey = false;

  // It must be a part of a complex key.
  } else {
      // Block context needs additional checks.
      // (Do we really need them? They will be catched by the parser
      // anyway.)
      if (!this.flowLevel) {
        // We are allowed to start a complex value if and only if
        // we can start a simple key.
        if (!this.allowSimpleKey) {
          throw new ScannerError(null, null,
                                 "mapping values are not allowed here",
                                 this.getMark());
        }
      }

      // If this value starts a new block mapping, we need to add
      // BLOCK-MAPPING-START.  It will be detected as an error later by
      // the parser.
      if (!this.flowLevel) {
        if (this.addIndent(this.column)) {
          mark = this.getMark();
          this.tokens.push(new _tokens.BlockMappingStartToken(mark, mark));
        }
      }

      // Simple keys are allowed after ':' in the block context.
      this.allowSimpleKey = !this.flowLevel;

      // Reset possible simple key on the current level.
      this.removePossibleSimpleKey();
  }

  // Add VALUE.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.ValueToken(startMark, endMark));
};

Scanner.prototype.fetchAlias = function fetchAlias() {
  // ALIAS could be a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after ALIAS.
  this.allowSimpleKey = false;

  // Scan and add ALIAS.
  this.tokens.push(this.scanAnchor(_tokens.AliasToken));
};

Scanner.prototype.fetchAnchor = function fetchAnchor() {
  // ANCHOR could start a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after ANCHOR.
  this.allowSimpleKey = false;

  // Scan and add ANCHOR.
  this.tokens.push(this.scanAnchor(_tokens.AnchorToken));
};

Scanner.prototype.fetchTag = function fetchTag() {
  // TAG could start a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after TAG.
  this.allowSimpleKey = false;

  // Scan and add TAG.
  this.tokens.push(this.scanTag());
};

Scanner.prototype.fetchLiteral = function fetchLiteral() {
  this.fetchBlockScalar('|');
};

Scanner.prototype.fetchFolded = function fetchFolded() {
  this.fetchBlockScalar('>');
};

Scanner.prototype.fetchBlockScalar = function fetchBlockScalar(style) {
  // A simple key may follow a block scalar.
  this.allowSimpleKey = true;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Scan and add SCALAR.
  this.tokens.push(this.scanBlockScalar(style));
};

Scanner.prototype.fetchSingle = function fetchSingle() {
  this.fetchFlowScalar('\'');
};

Scanner.prototype.fetchDouble = function fetchDouble() {
  this.fetchFlowScalar('"');
};

Scanner.prototype.fetchFlowScalar = function fetchFlowScalar(style) {
  // A flow scalar could be a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after flow scalars.
  this.allowSimpleKey = false;

  // Scan and add SCALAR.
  this.tokens.push(this.scanFlowScalar(style));
};

Scanner.prototype.fetchPlain = function fetchPlain() {
  // A plain scalar could be a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after plain scalars. But note that `scan_plain` will
  // change this flag if the scan is finished at the beginning of the
  // line.
  this.allowSimpleKey = false;

  // Scan and add SCALAR. May change `allow_simple_key`.
  this.tokens.push(this.scanPlain());
};

Scanner.prototype.checkDirective = function checkDirective() {
  // DIRECTIVE:    ^ '%' ...
  // The '%' indicator is already checked.
  return (this.column === 0);
};

Scanner.prototype.checkDocumentStart = function checkDocumentStart() {
  // DOCUMENT-START:   ^ '---' (' '|'\n')
  if (+this.column === 0 && this.prefix(3) === '---') {
    return (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3)));
  }

  return false;
};

Scanner.prototype.checkDocumentEnd = function checkDocumentEnd() {
  // DOCUMENT-END:   ^ '...' (' '|'\n')
  if (+this.column === 0 && this.prefix(3) === '...') {
    return (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3)));
  }

  return false;
};

Scanner.prototype.checkBlockEntry = function checkBlockEntry() {
  // BLOCK-ENTRY:    '-' (' '|'\n')
  return (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1)));
};

Scanner.prototype.checkKey = function checkKey() {
  // KEY(flow context):  '?'
  if (this.flowLevel) {
    return true;
  }

  // KEY(block context):   '?' (' '|'\n')
  return 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1));
};

Scanner.prototype.checkValue = function checkValue() {
  // VALUE(flow context):  ':'
  if (this.flowLevel) {
    return true;
  }

  // VALUE(block context): ':' (' '|'\n')
  return 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1));
};

Scanner.prototype.checkPlain = function checkPlain() {
  // A plain scalar may start with any non-space character except:
  //   '-', '?', ':', ',', '[', ']', '{', '}',
  //   '#', '&', '*', '!', '|', '>', '\'', '\"',
  //   '%', '@', '`'.
  //
  // It may also start with
  //   '-', '?', ':'
  // if it is followed by a non-space character.
  //
  // Note that we limit the last rule to the block context (except the
  // '-' character) because we want the flow context to be space
  // independent.
  var ch = this.peek();
  return (
   -1 === '\x00 \t\r\n\x85\u2028\u2029-?:,[]{}#&*!|>\'\"%@`'.indexOf(ch)
   ||
   (
      -1 === '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1))
      &&
      (
        ch === '-' || (!this.flowLevel && 0 <= '?:'.indexOf(ch))
      )
    )
  );
};

Scanner.prototype.scanToNextToken = function scanToNextToken() {
  var found = false;

  // We ignore spaces, line breaks and comments.
  // If we find a line break in the block context, we set the flag
  // `allow_simple_key` on.
  // The byte order mark is stripped if it's the first character in the
  // stream. We do not yet support BOM inside the stream as the
  // specification requires. Any such mark will be considered as a part
  // of the document.
  //
  // TODO: We need to make tab handling rules more sane. A good rule is
  //   Tabs cannot precede tokens
  //   BLOCK-SEQUENCE-START, BLOCK-MAPPING-START, BLOCK-END,
  //   KEY(block), VALUE(block), BLOCK-ENTRY
  // So the checking code is
  //   if <TAB>:
  //     self.allow_simple_keys = False
  // We also need to add the check for `allow_simple_keys == True` to
  // `unwind_indent` before issuing BLOCK-END.
  // Scanners for block, flow, and plain scalars need to be modified.

  if (this.index === 0 && this.peek() === '\uFEFF') {
    this.forward();
  }

  while (!found) {
    while (this.peek() === ' ') {
      this.forward();
    }

    if (this.peek() === '#') {
      while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
        this.forward();
      }
    }

    if (this.scanLineBreak()) {
      if (!this.flowLevel) {
        this.allowSimpleKey = true;
      }
    } else {
      found = true;
    }
  }
};

Scanner.prototype.scanDirective = function scanDirective() {
  var startMark, endMark, name, value;

  // See the specification for details.
  startMark = this.getMark();
  this.forward();
  name = this.scanDirectiveName(startMark);
  value = null;

  if (name === 'YAML') {
    value = this.scanYamlDirectiveValue(startMark);
    endMark = this.getMark();
  } else if (name === 'TAG') {
    value = this.scanTagDirectiveValue(startMark);
    endMark = this.getMark();
  } else {
    endMark = this.getMark();

    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      this.forward();
    }
  }

  this.scanDirectiveIgnoredLine(startMark);
  return new _tokens.DirectiveToken(name, value, startMark, endMark);
};

Scanner.prototype.scanDirectiveName = function scanDirectiveName(startMark) {
  var length, ch, value;

  // See the specification for details.
  length = 0;
  ch = this.peek(length);

  while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-_'.indexOf(ch)) {
    length += 1;
    ch = this.peek(length);
  }

  if (!length) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  value = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  return value;
};

Scanner.prototype.scanYamlDirectiveValue = function scanYamlDirectiveValue(startMark) {
  var major, minor;

  // See the specification for details.

  while (this.peek() === ' ') {
    this.forward();
  }

  major = this.scanYamlDirectiveNumber(startMark);

  if (this.peek() !== '.') {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a digit or '.', but found " + this.peek(),
        this.getMark());
  }

  this.forward();

  minor = this.scanYamlDirectiveNumber(startMark);

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(this.peek())) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a digit or ' ', but found " + this.peek(),
        this.getMark());
  }

  return [major, minor];
};

Scanner.prototype.scanYamlDirectiveNumber = function scanYamlDirectiveNumber(startMark) {
  var ch, length, value;

  // See the specification for details.

  ch = this.peek();

  if (!/^[0-9]/.test(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a digit, but found " + ch, this.getMark());
  }

  length = 0;

  while (/^[0-9]/.test(this.peek(length))) {
    length += 1;
  }

  value = +(this.prefix(length));
  this.forward(length);

  return value;
};

Scanner.prototype.scanTagDirectiveValue = function scanTagDirectiveValue(startMark) {
  var handle, prefix;

  // See the specification for details.
  while (this.peek() === ' ') {
    this.forward();
  }

  handle = this.scanTagDirectiveHandle(startMark);

  while (this.peek() === ' ') {
    this.forward();
  }

  prefix = this.scanTagDirectivePrefix(startMark);

  return [handle, prefix];
};

Scanner.prototype.scanTagDirectiveHandle = function scanTagDirectiveHandle(startMark) {
  var value, ch;

  // See the specification for details.
  value = this.scanTagHandle('directive', startMark);
  ch = this.peek();

  if (ch !== ' ') {
    throw new ScannerError("while scanning a directive", startMark,
        "expected ' ', but found " + ch, this.getMark());
  }

  return value;
};

Scanner.prototype.scanTagDirectivePrefix = function scanTagDirectivePrefix(startMark) {
  var value, ch;

  // See the specification for details.
  value = this.scanTagUri('directive', startMark);
  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
                           "expected ' ', but found " + ch, this.getMark());
  }

  return value;
};

Scanner.prototype.scanDirectiveIgnoredLine = function scanDirectiveIgnoredLine(startMark) {
  var ch;

  // See the specification for details.
  while (this.peek() === ' ') {
    this.forward();
  }

  if (this.peek() === '#') {
    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      this.forward();
    }
  }

  ch = this.peek();

  if (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a comment or a line break, but found " + ch,
        this.getMark());
  }

  this.scanLineBreak();
};

Scanner.prototype.scanAnchor = function scanAnchor(TokenClass) {
  var startMark, indicator, name, length, ch, value;

  // The specification does not restrict characters for anchors and
  // aliases. This may lead to problems, for instance, the document:
  //   [ *alias, value ]
  // can be interpteted in two ways, as
  //   [ "value" ]
  // and
  //   [ *alias , "value" ]
  // Therefore we restrict aliases to numbers and ASCII letters.

  startMark = this.getMark();
  indicator = this.peek();
  name = (indicator === '*') ? 'alias' : 'anchor';

  this.forward();
  length = 0;
  ch = this.peek(length);

  while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-_'.indexOf(ch)) {
    length += 1;
    ch = this.peek(length);
  }
    
  if (!length) {
    throw new ScannerError("while scanning an " + name, startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  value = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (-1 === '\x00 \t\r\n\x85\u2028\u2029?:,]}%@`'.indexOf(ch)) {
    throw new ScannerError("while scanning an " + name, startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  return new TokenClass(value, startMark, this.getMark());
};

Scanner.prototype.scanTag = function scanTag() {
  var startMark, ch, handle, suffix, length, useHandle;

  // See the specification for details.
  startMark = this.getMark();
  ch = this.peek(1);

  if (ch === '<') {
    handle = null;
    this.forward(2);
    suffix = this.scanTagUri('tag', startMark);

    if (this.peek() !== '>') {
      throw new ScannerError("while parsing a tag", startMark,
          "expected '>', but found " + this.peek(),
          this.getMark());
    }

    this.forward();
  } else if (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(ch)) {
    handle = null;
    suffix = '!';

    this.forward();
  } else {
    length = 1;
    useHandle = false;

    while (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
      if (ch === '!') {
        useHandle = true;
        break;
      }

      length += 1;
      ch = this.peek(length);
    }

    if (useHandle) {
      handle = this.scanTagHandle('tag', startMark);
    } else {
      handle = '!';
      this.forward();
    }

    suffix = this.scanTagUri('tag', startMark);
  }

  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a tag", startMark,
                           "expected ' ', but found " + ch, this.getMark());
  }

  return new _tokens.TagToken([handle, suffix], startMark, this.getMark());
};

Scanner.prototype.scanBlockScalar = function scanBlockScalar(style) {
  var folded, chunks, startMark, endMark, chomping, increment = null,
      minIndent, maxIndent, indent, breaks, lineBreak, leadingNonSpace,
      tuple, length;
  // See the specification for details.

  folded = (style === '>');
  chunks = [];
  startMark = this.getMark();

  // Scan the header.
  this.forward();
  tuple = this.scanBlockScalarIndicators(startMark);
  chomping = tuple[0];
  increment = tuple[1] || null;
  this.scanBlockScalarIgnoredLine(startMark);

  // Determine the indentation level and go to the first non-empty line.
  minIndent = this.indent + 1;

  if (minIndent < 1) {
    minIndent = 1;
  }

  if (null === increment) {
    tuple = this.scanBlockScalarIndentation();
    breaks = tuple[0];
    maxIndent = tuple[1];
    endMark = tuple[2];
    indent = Math.max(minIndent, maxIndent);
  } else {
    indent = minIndent + increment - 1;
    tuple = this.scanBlockScalarBreaks(indent);
    breaks = tuple[0];
    endMark = tuple[1];
  }

  lineBreak = '';

  // Scan the inner part of the block scalar.
  while (+this.column === indent && this.peek() !== '\x00') {
    chunks = chunks.concat(breaks);
    leadingNonSpace = -1 === ' \t'.indexOf(this.peek());
    length = 0;

    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek(length))) {
      length += 1;
    }

    chunks.push(this.prefix(length));
    this.forward(length);
    lineBreak = this.scanLineBreak();

    tuple = this.scanBlockScalarBreaks(indent);
    breaks = tuple[0];
    endMark = tuple[1];

    if (+this.column !== indent || this.peek() === '\x00') {
      break;
    }

    // Unfortunately, folding rules are ambiguous.
    //
    // This is the folding according to the specification:

    if (folded && lineBreak === '\n' && leadingNonSpace && -1 === ' \t'.indexOf(this.peek())) {
      if (!breaks || !breaks.length) {
        chunks.push(' ');
      }
    } else {
      chunks.push(lineBreak);
    }
    
    // This is Clark Evans's interpretation (also in the spec
    // examples):
    //
    //if folded and line_break == '\n':
    //  if not breaks:
    //    if this.peek() not in ' \t':
    //      chunks.append(' ')
    //    else:
    //      chunks.append(line_break)
    //else:
    //  chunks.append(line_break)
  }

  // Chomp the tail.
  if (false !== chomping) {
    chunks.push(lineBreak);
  }

  if (true === chomping) {
    chunks = chunks.concat(breaks);
  }

  // We are done.
  return new _tokens.ScalarToken(chunks.join(''), false, startMark, endMark, style);
};

Scanner.prototype.scanBlockScalarIndicators = function scanBlockScalarIndicators(startMark) {
  var chomping = null, increment = null, ch = this.peek();

  // See the specification for details.
  if (0 <= '+-'.indexOf(ch)) {
    chomping = (ch === '+');
    this.forward();
    ch = this.peek();

    if (0 <= '0123456789'.indexOf(ch)) {
      increment = +ch;
      if (increment === 0) {
        throw new ScannerError("while scanning a block scalar", startMark,
            "expected indentation indicator in the range 1-9, but found 0",
            this.getMark());
      }
      this.forward();
    }
  } else if (0 <= '0123456789'.indexOf(ch)) {
    increment = +ch;
    if (increment === 0) {
      throw new ScannerError("while scanning a block scalar", startMark,
          "expected indentation indicator in the range 1-9, but found 0",
          this.getMark());
    }

    this.forward();
    ch = this.peek();

    if (0 <= '+-'.indexOf(ch)) {
      chomping = (ch === '+');
      this.forward();
    }
  }

  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a block scalar", startMark,
        "expected chomping or indentation indicators, but found " + ch,
        this.getMark());
  }

  return [chomping, increment];
};

Scanner.prototype.scanBlockScalarIgnoredLine = function scanBlockScalarIgnoredLine(startMark) {
  var ch;

  // See the specification for details.
  while (this.peek() === ' ') {
    this.forward();
  }

  if (this.peek() === '#') {
    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      this.forward();
    }
  }

  ch = this.peek();

  if (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a block scalar", startMark,
        "expected a comment or a line break, but found " + ch,
        this.getMark());
  }

  this.scanLineBreak();
};

Scanner.prototype.scanBlockScalarIndentation = function scanBlockScalarIndentation() {
  var chunks, maxIndent, endMark;
  // See the specification for details.
  chunks = [];
  maxIndent = 0;
  endMark = this.getMark();

  while (0 <= ' \r\n\x85\u2028\u2029'.indexOf(this.peek())) {
    if (this.peek() !== ' ') {
      chunks.push(this.scanLineBreak());
      endMark = this.getMark();
    } else {
      this.forward();
      if (this.column > maxIndent) {
        maxIndent = this.column;
      }
    }
  }

  return [chunks, maxIndent, endMark];
};

Scanner.prototype.scanBlockScalarBreaks = function scanBlockScalarBreaks(indent) {
  var chunks, endMark;
  // See the specification for details.
  chunks = [];
  endMark = this.getMark();

  while (this.column < indent && this.peek() === ' ') {
    this.forward();
  }

  while (0 <= '\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
    chunks.push(this.scanLineBreak());
    endMark = this.getMark();

    while (this.column < indent && this.peek() === ' ') {
      this.forward();
    }
  }

  return [chunks, endMark];
};

Scanner.prototype.scanFlowScalar = function scanFlowScalar(style) {
  var double, chunks, length, code, startMark, quote, endMark;
  // See the specification for details.
  // Note that we loose indentation rules for quoted scalars. Quoted
  // scalars don't need to adhere indentation because " and ' clearly
  // mark the beginning and the end of them. Therefore we are less
  // restrictive then the specification requires. We only need to check
  // that document separators are not included in scalars.
  double = (style === '"');
  chunks = [];
  startMark = this.getMark();
  quote = this.peek();
  this.forward();

  chunks = chunks.concat(this.scanFlowScalarNonSpaces(double, startMark));

  while (this.peek() !== quote) {
    chunks = chunks.concat(this.scanFlowScalarSpaces(double, startMark));
    chunks = chunks.concat(this.scanFlowScalarNonSpaces(double, startMark));
  }

  this.forward();
  endMark = this.getMark();

  return new _tokens.ScalarToken(chunks.join(''), false, startMark, endMark, style);
};

Scanner.prototype.scanFlowScalarNonSpaces = function scanFlowScalarNonSpaces(double, startMark) {
  var self = this, chunks, length, ch, code, validator;

  validator = function (k) {
    if (-1 === '0123456789ABCDEFabcdef'.indexOf(self.peek(k))) {
      throw new ScannerError("while scanning a double-quoted scalar", startMark,
          "expected escape sequence of " + length + " hexdecimal numbers, but found " + self.peek(k),
          self.getMark());
    }
  };

  // See the specification for details.
  chunks = [];
  while (true) {
    length = 0;

    while (-1 === '\'\"\\\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(length))) {
      length += 1;
    }

    if (length) {
      chunks.push(this.prefix(length));
      this.forward(length);
    }

    ch = this.peek();

    if (!double && ch === '\'' && this.peek(1) === '\'') {
      chunks.push('\'');
      this.forward(2);
    } else if ((double && ch === '\'') || (!double && 0 <= '\"\\'.indexOf(ch))) {
      chunks.push(ch);
      this.forward();
    } else if (double && ch === '\\') {
      this.forward();
      ch = this.peek();

      if (ESCAPE_REPLACEMENTS.hasOwnProperty(ch)) {
        chunks.push(ESCAPE_REPLACEMENTS[ch]);
        this.forward();
      } else if (ESCAPE_CODES.hasOwnProperty(ch)) {
        length = ESCAPE_CODES[ch];
        this.forward();
        range(length).forEach(validator);
        code = parseInt(this.prefix(length), 16);
        chunks.push(String.fromCharCode(code));
        this.forward(length);
      } else if (0 <= '\r\n\x85\u2028\u2029'.indexOf(ch)) {
        this.scanLineBreak();
        chunks = chunks.concat(this.scanFlowScalarBreaks(double, startMark));
      } else {
        throw new ScannerError("while scanning a double-quoted scalar", startMark,
                               "found unknown escape character " + ch, this.getMark());
      }
    } else {
      return chunks;
    }
  }
};

Scanner.prototype.scanFlowScalarSpaces = function scanFlowScalarSpaces(double, startMark) {
  var chunks, length, whitespaces, ch, lineBreak, breaks;
  // See the specification for details.
  chunks = [];
  length = 0;

  while (0 <= ' \t'.indexOf(this.peek(length))) {
    length += 1;
  }

  whitespaces = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (ch === '\x00') {
    throw new ScannerError("while scanning a quoted scalar", startMark,
                           "found unexpected end of stream", this.getMark());
  } else if (0 <= '\r\n\x85\u2028\u2029'.indexOf(ch)) {
    lineBreak = this.scanLineBreak();
    breaks = this.scanFlowScalarBreaks(double, startMark);

    if (lineBreak !== '\n') {
      chunks.push(lineBreak);
    } else if (!breaks) {
      chunks.push(' ');
    }

    chunks = chunks.concat(breaks);
  } else {
    chunks.push(whitespaces);
  }

  return chunks;
};

Scanner.prototype.scanFlowScalarBreaks = function scanFlowScalarBreaks(double, startMark) {
  var chunks = [], prefix;

  // See the specification for details.

  while (true) {
    // Instead of checking indentation, we check for document
    // separators.
    prefix = this.prefix(3);

    if ((prefix === '---' || prefix === '...') && 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3))) {
      throw new ScannerError("while scanning a quoted scalar", startMark,
                             "found unexpected document separator", this.getMark());
    }

    while (0 <= ' \t'.indexOf(this.peek())) {
      this.forward();
    }

    if (0 <= '\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      chunks.push(this.scanLineBreak());
    } else {
      return chunks;
    }
  }
};

Scanner.prototype.scanPlain = function scanPlain() {
  var ch, chunks, startMark, endMark, indent, spaces, length;

  // See the specification for details.
  // We add an additional restriction for the flow context:
  //   plain scalars in the flow context cannot contain ',', ':' and '?'.
  // We also keep track of the `allow_simple_key` flag here.
  // Indentation rules are loosed for the flow context.

  chunks = [];
  startMark = this.getMark();
  endMark = startMark;
  indent = this.indent + 1;
  spaces = [];

  // We allow zero indentation for scalars, but then we need to check for
  // document separators at the beginning of the line.
  //if indent == 0:
  //  indent = 1

  while (true) {
    length = 0;

    if (this.peek() === '#') {
      break;
    }

    while (true) {
      ch = this.peek(length);

      if (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(ch)
          || (!this.flowLevel && ch === ':'
              && 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(length + 1)))
          || (this.flowLevel && 0 <= ',:?[]{}'.indexOf(ch))) {
        break;
      }

      length += 1;
    }

    // It's not clear what we should do with ':' in the flow context.
    if (this.flowLevel && ch === ':' && -1 === '\x00 \t\r\n\x85\u2028\u2029,[]{}'.indexOf(this.peek(length + 1))) {
      this.forward(length);
      throw new ScannerError("while scanning a plain scalar", startMark,
        "found unexpected ':'", this.getMark(),
        "Please check http://pyyaml.org/wiki/YAMLColonInFlowContext for details.");
    }

    if (length === 0) {
      break;
    }

    this.allowSimpleKey = false;
    chunks = chunks.concat(spaces);
    chunks.push(this.prefix(length));

    this.forward(length);
    endMark = this.getMark();
    spaces = this.scanPlainSpaces(indent, startMark);

    if (!Array.isArray(spaces) || !spaces.length || this.peek() === '#'
        || (!this.flowLevel && this.column < indent)) {
      break;
    }
  }

  return new _tokens.ScalarToken(chunks.join(''), true, startMark, endMark);
};

Scanner.prototype.scanPlainSpaces = function scanPlainSpaces(indent, startMark) {
  var chunks, length, whitespaces, ch, prefix, breaks, lineBreak;

  // See the specification for details.
  // The specification is really confusing about tabs in plain scalars.
  // We just forbid them completely. Do not use tabs in YAML!

  chunks = [];
  length = 0;

  while (this.peek(length) === ' ') {
    length += 1;
  }

  whitespaces = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (0 <= '\r\n\x85\u2028\u2029'.indexOf(ch)) {
    lineBreak = this.scanLineBreak();
    this.allowSimpleKey = true;
    prefix = this.prefix(3);

    if ((prefix === '---' || prefix === '...')
        && 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3))) {
      return;
    }

    breaks = [];

    while (0 <= ' \r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      if (this.peek() === ' ') {
        this.forward();
      } else {
        breaks.push(this.scanLineBreak());
        prefix = this.prefix(3);

        if ((prefix === '---' || prefix === '...')
            && 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3))) {
          return;
        }
      }
    }

    if (lineBreak !== '\n') {
      chunks.push(lineBreak);
    } else if (!breaks || !breaks.length) {
      chunks.push(' ');
    }

    chunks = chunks.concat(breaks);
  } else if (whitespaces) {
    chunks.push(whitespaces);
  }

  return chunks;
};

Scanner.prototype.scanTagHandle = function scanTagHandle(name, startMark) {
  var ch, length, value;

  // See the specification for details.
  // For some strange reasons, the specification does not allow '_' in
  // tag handles. I have allowed it anyway.

  ch = this.peek();

  if (ch !== '!') {
    throw new ScannerError("while scanning a " + name, startMark,
                           "expected '!', but found " + ch, this.getMark());
  }

  length = 1;
  ch = this.peek(length);

  if (ch !== ' ') {
    while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-_'.indexOf(ch)) {
      length += 1;
      ch = this.peek(length);
    }

    if (ch !== '!') {
      this.forward(length);
      throw new ScannerError("while scanning a " + name, startMark,
                             "expected '!', but found " + ch, this.getMark());
    }

    length += 1;
  }

  value = this.prefix(length);
  this.forward(length);

  return value;
};

Scanner.prototype.scanTagUri = function scanTagUri(name, startMark) {
  var chunks, length, ch;

  // See the specification for details.
  // Note: we do not check if URI is well-formed.

  chunks = [];
  length = 0;
  ch = this.peek(length);

  while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-;/?:@&=+$,_.!~*\'()[]%'.indexOf(ch)) {
    if (ch === '%') {
      chunks.push(this.prefix(length));
      this.forward(length);
      length = 0;
      chunks.push(this.scanUriEscapes(name, startMark));
    } else {
      length += 1;
    }

    ch = this.peek(length);
  }

  if (length) {
    chunks.push(this.prefix(length));
    this.forward(length);
    length = 0;
  }

  if (!chunks.length) {
    throw new ScannerError("while parsing a " + name, startMark,
        "expected URI, but found " + ch, this.getMark());
  }

  return chunks.join('');
};

Scanner.prototype.scanUriEscapes = function scanUriEscapes(name, startMark) {
  var self = this, codes, mark, value, validator;

  // See the specification for details.
  codes = [];
  mark = this.getMark();

  validator = function (k) {
    if (-1 === '0123456789ABCDEFabcdef'.indexOf(self.peek(k))) {
      throw new ScannerError("while scanning a " + name, startMark,
        "expected URI escape sequence of 2 hexdecimal numbers, but found " + self.peek(k),
        self.getMark());
    }
  };

  while (this.peek() === '%') {
    this.forward();
    range(2).forEach(validator);
    codes.push(parseInt(this.prefix(2), 16));
    this.forward(2);
  }

  try {
    value = (new Buffer(codes)).toString('utf8');
  } catch (err) {
    throw new ScannerError("while scanning a " + name, startMark, err.toString(), mark);
  }

  return value;
};

Scanner.prototype.scanLineBreak = function scanLineBreak() {
  var ch;

  // Transforms:
  //   '\r\n'    :   '\n'
  //   '\r'    :   '\n'
  //   '\n'    :   '\n'
  //   '\x85'    :   '\n'
  //   '\u2028'  :   '\u2028'
  //   '\u2029   :   '\u2029'
  //   default   :   ''
  
  ch = this.peek();

  if (0 <= '\r\n\x85'.indexOf(ch)) {
    if (this.prefix(2) === '\r\n') {
      this.forward(2);
    } else {
      this.forward();
    }

    return '\n';
  } else if (0 <= '\u2028\u2029'.indexOf(ch)) {
    this.forward();
    return ch;
  }

  return '';
};


module.exports.Scanner = Scanner;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/tokens.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');


function Token(startMark, endMark) {
  this.startMark = startMark || null;
  this.endMark = endMark || null;
}

Token.prototype.hash =
Token.prototype.toString = function toString() {
  var values = [], self = this;
    
  Object.getOwnPropertyNames(this).forEach(function (key) {
    if (!/startMark|endMark|__meta__/.test(key)) {
      values.push(key + ':' + self[key]);
    }
  });

  return this.constructor.name + '(' + values.join(', ') + ')';
};


function DirectiveToken(name, value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.name = name;
  this.value = value;
}
$$.inherits(DirectiveToken, Token);
DirectiveToken.id = '<directive>';


function DocumentStartToken() { Token.apply(this, arguments); }
$$.inherits(DocumentStartToken, Token);
DocumentStartToken.id = '<document start>';


function DocumentEndToken() { Token.apply(this, arguments); }
$$.inherits(DocumentEndToken, Token);
DocumentEndToken.id = '<document end>';


function StreamStartToken(startMark, endMark, encoding) {
  Token.call(this, startMark, endMark);
  this.encoding = encoding || null;
}
$$.inherits(StreamStartToken, Token);
StreamStartToken.id = '<stream start>';


function StreamEndToken() { Token.apply(this, arguments); }
$$.inherits(StreamEndToken, Token);
StreamEndToken.id = '<stream end>';


function BlockSequenceStartToken() { Token.apply(this, arguments); }
$$.inherits(BlockSequenceStartToken, Token);
BlockSequenceStartToken.id = '<block sequence start>';


function BlockMappingStartToken() { Token.apply(this, arguments); }
$$.inherits(BlockMappingStartToken, Token);
BlockMappingStartToken.id = '<block mapping start>';


function BlockEndToken() { Token.apply(this, arguments); }
$$.inherits(BlockEndToken, Token);
BlockEndToken.id = '<block end>';


function FlowSequenceStartToken() { Token.apply(this, arguments); }
$$.inherits(FlowSequenceStartToken, Token);
FlowSequenceStartToken.id = '[';


function FlowMappingStartToken() { Token.apply(this, arguments); }
$$.inherits(FlowMappingStartToken, Token);
FlowMappingStartToken.id = '{';


function FlowSequenceEndToken() { Token.apply(this, arguments); }
$$.inherits(FlowSequenceEndToken, Token);
FlowSequenceEndToken.id = ']';


function FlowMappingEndToken() { Token.apply(this, arguments); }
$$.inherits(FlowMappingEndToken, Token);
FlowMappingEndToken.id = '}';


function KeyToken() { Token.apply(this, arguments); }
$$.inherits(KeyToken, Token);
KeyToken.id = '?';


function ValueToken() { Token.apply(this, arguments); }
$$.inherits(ValueToken, Token);
ValueToken.id = ':';


function BlockEntryToken() { Token.apply(this, arguments); }
$$.inherits(BlockEntryToken, Token);
BlockEntryToken.id = '-';


function FlowEntryToken() { Token.apply(this, arguments); }
$$.inherits(FlowEntryToken, Token);
FlowEntryToken.id = ',';


function AliasToken(value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.value = value;
}
$$.inherits(AliasToken, Token);
AliasToken.id = '<alias>';


function AnchorToken(value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.value = value;
}
$$.inherits(AnchorToken, Token);
AnchorToken.id = '<anchor>';


function TagToken(value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.value = value;
}
$$.inherits(TagToken, Token);
TagToken.id = '<tag>';


function ScalarToken(value, plain, startMark, endMark, style) {
  Token.call(this, startMark, endMark);
  this.value = value;
  this.plain = plain;
  this.style = style || null;
}
$$.inherits(ScalarToken, Token);
TagToken.id = '<scalar>';


module.exports.DirectiveToken = DirectiveToken;
module.exports.DocumentStartToken = DocumentStartToken;
module.exports.DocumentEndToken = DocumentEndToken;
module.exports.StreamStartToken = StreamStartToken;
module.exports.StreamEndToken = StreamEndToken;
module.exports.BlockSequenceStartToken = BlockSequenceStartToken;
module.exports.BlockMappingStartToken = BlockMappingStartToken;
module.exports.BlockEndToken = BlockEndToken;
module.exports.FlowSequenceStartToken = FlowSequenceStartToken;
module.exports.FlowMappingStartToken = FlowMappingStartToken;
module.exports.FlowSequenceEndToken = FlowSequenceEndToken;
module.exports.FlowMappingEndToken = FlowMappingEndToken;
module.exports.KeyToken = KeyToken;
module.exports.ValueToken = ValueToken;
module.exports.BlockEntryToken = BlockEntryToken;
module.exports.FlowEntryToken = FlowEntryToken;
module.exports.AliasToken = AliasToken;
module.exports.AnchorToken = AnchorToken;
module.exports.TagToken = TagToken;
module.exports.ScalarToken = ScalarToken;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/parser.js", function (require, module, exports, __dirname, __filename) {
    // The following YAML grammar is LL(1) and is parsed by a recursive descent
// parser.
//
// stream            ::= STREAM-START implicit_document? explicit_document* STREAM-END
// implicit_document ::= block_node DOCUMENT-END*
// explicit_document ::= DIRECTIVE* DOCUMENT-START block_node? DOCUMENT-END*
// block_node_or_indentless_sequence ::=
//                       ALIAS
//                       | properties (block_content | indentless_block_sequence)?
//                       | block_content
//                       | indentless_block_sequence
// block_node        ::= ALIAS
//                       | properties block_content?
//                       | block_content
// flow_node         ::= ALIAS
//                       | properties flow_content?
//                       | flow_content
// properties        ::= TAG ANCHOR? | ANCHOR TAG?
// block_content     ::= block_collection | flow_collection | SCALAR
// flow_content      ::= flow_collection | SCALAR
// block_collection  ::= block_sequence | block_mapping
// flow_collection   ::= flow_sequence | flow_mapping
// block_sequence    ::= BLOCK-SEQUENCE-START (BLOCK-ENTRY block_node?)* BLOCK-END
// indentless_sequence   ::= (BLOCK-ENTRY block_node?)+
// block_mapping     ::= BLOCK-MAPPING_START
//                       ((KEY block_node_or_indentless_sequence?)?
//                       (VALUE block_node_or_indentless_sequence?)?)*
//                       BLOCK-END
// flow_sequence     ::= FLOW-SEQUENCE-START
//                       (flow_sequence_entry FLOW-ENTRY)*
//                       flow_sequence_entry?
//                       FLOW-SEQUENCE-END
// flow_sequence_entry   ::= flow_node | KEY flow_node? (VALUE flow_node?)?
// flow_mapping      ::= FLOW-MAPPING-START
//                       (flow_mapping_entry FLOW-ENTRY)*
//                       flow_mapping_entry?
//                       FLOW-MAPPING-END
// flow_mapping_entry    ::= flow_node | KEY flow_node? (VALUE flow_node?)?
//
// FIRST sets:
//
// stream: { STREAM-START }
// explicit_document: { DIRECTIVE DOCUMENT-START }
// implicit_document: FIRST(block_node)
// block_node: { ALIAS TAG ANCHOR SCALAR BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START }
// flow_node: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START }
// block_content: { BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START SCALAR }
// flow_content: { FLOW-SEQUENCE-START FLOW-MAPPING-START SCALAR }
// block_collection: { BLOCK-SEQUENCE-START BLOCK-MAPPING-START }
// flow_collection: { FLOW-SEQUENCE-START FLOW-MAPPING-START }
// block_sequence: { BLOCK-SEQUENCE-START }
// block_mapping: { BLOCK-MAPPING-START }
// block_node_or_indentless_sequence: { ALIAS ANCHOR TAG SCALAR BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START BLOCK-ENTRY }
// indentless_sequence: { ENTRY }
// flow_collection: { FLOW-SEQUENCE-START FLOW-MAPPING-START }
// flow_sequence: { FLOW-SEQUENCE-START }
// flow_mapping: { FLOW-MAPPING-START }
// flow_sequence_entry: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START KEY }
// flow_mapping_entry: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START KEY }


'use strict';


var $$ = require('./common');
var _errors = require('./errors');
var _tokens = require('./tokens');
var _events = require('./events');


function ParserError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ParserError';
}
$$.inherits(ParserError, _errors.MarkedYAMLError);


var DEFAULT_TAGS = {
  '!':  '!',
  '!!': 'tag:yaml.org,2002:'
};


function Parser(self) {
  this.currentEvent = null;
  this.yamlVersion = null;
  this.tagHandles = {};
  this.states = [];
  this.marks = [];
  this.state = this.parseStreamStart.bind(this);
}


Parser.prototype.dispose = function dispose() {
  // Reset the state attributes (to clear self-references)
  this.states = [];
  this.state = null;
};

Parser.prototype.checkEvent = function checkEvent() {
  var i;

  // Check the type of the next event.
  if (null === this.currentEvent && !!this.state) {
    this.currentEvent = this.state();
  }

  if (null !== this.currentEvent) {
    if (0 === arguments.length) {
      return true;
    }

    for (i = 0; i < arguments.length; i += 1) {
      if ($$.isInstanceOf(this.currentEvent, arguments[i])) {
        return true;
      }
    }
  }

  return false;
};

Parser.prototype.peekEvent = function peekEvent() {
  // Get the next event.
  if (null === this.currentEvent && !!this.state) {
    this.currentEvent = this.state();
  }

  return this.currentEvent;
};

Parser.prototype.getEvent = function getEvent() {
  var value;

  // Get the next event and proceed further.
  if (null === this.currentEvent && !!this.state) {
    this.currentEvent = this.state();
  }

  value = this.currentEvent;
  this.currentEvent = null;

  return value;
};

Parser.prototype.parseStreamStart = function parseStreamStart() {
  var token, event;

  // Parse the stream start.
  token = this.getToken();
  event = new _events.StreamStartEvent(token.startMark, token.endMark,
                                  token.encoding);

  // Prepare the next state.
  this.state = this.parseImplicitDocumentStart.bind(this);

  return event;
};

Parser.prototype.parseImplicitDocumentStart = function parseImplicitDocumentStart() {
  var token, event;
  if (this.checkToken(_tokens.DirectiveToken, _tokens.DocumentStartToken, _tokens.StreamEndToken)) {
    return this.parseDocumentStart();
  }

  // Parse an implicit document.
  this.tagHandles = DEFAULT_TAGS;
  token = this.peekToken();
  event = new _events.DocumentStartEvent(token.startMark, token.startMark, false);

  // Prepare the next state.
  this.states.push(this.parseDocumentEnd.bind(this));
  this.state = this.parseBlockNode.bind(this);

  return event;
};

Parser.prototype.parseDocumentStart = function parseDocumentStart() {
  var token, event, version, tags, startMark, tuple;

  // Parse any extra document end indicators.
  while (this.checkToken(_tokens.DocumentEndToken)) {
      this.getToken();
  }

  if (this.checkToken(_tokens.StreamEndToken)) {
    // Parse the end of the stream.
    token = this.getToken();
    event = new _events.StreamEndEvent(token.startMark, token.endMark);

    // Should be empty arrays
    if (this.states && this.states.length) {
      throw new _errors.YAMLError('States supposed to be empty');
    }
    if (this.marks && this.marks.length) {
      throw new _errors.YAMLError('Marks supposed to be empty');
    }

    this.state = null;
    return event;
  }

  // Parse an explicit document.
  token = this.peekToken();
  startMark = token.startMark;

  tuple = this.processDirectives();
  version = tuple.shift();
  tags = tuple.shift();

  if (!this.checkToken(_tokens.DocumentStartToken)) {
    throw new ParserError(null, null,
                "expected '<document start>', but found " + this.peekToken().constructor.id,
                this.peekToken().startMark);
  }

  token = this.getToken();
  event = new _events.DocumentStartEvent(startMark, token.endMark, true, version, tags);

  this.states.push(this.parseDocumentEnd.bind(this));
  this.state = this.parseDocumentContent.bind(this);

  return event;
};

Parser.prototype.parseDocumentEnd = function parseDocumentEnd() {
  var token, event, explicit, startMark, endMark;

  // Parse the document end.
  token = this.peekToken();
  startMark = endMark = token.startMark;
  explicit = false;

  if (this.checkToken(_tokens.DocumentEndToken)) {
      token = this.getToken();
      endMark = token.endMark;
      explicit = true;
  }

  event = new _events.DocumentEndEvent(startMark, endMark, explicit);

  // Prepare the next state.
  this.state = this.parseDocumentStart.bind(this);

  return event;
};

Parser.prototype.parseDocumentContent = function parseDocumentContent() {
  var event;

  if (!this.checkToken(_tokens.DirectiveToken, _tokens.DocumentStartToken,
                       _tokens.DocumentEndToken, _tokens.StreamEndToken)) {
    return this.parseBlockNode();
  }

  event = this.processEmptyScalar(this.peekToken().startMark);
  this.state = this.states.pop();

  return event;
};

Parser.prototype.processDirectives = function processDirectives() {
  var token, handle, prefix, value;

  this.yamlVersion = null;
  this.tagHandles = {};

  while (this.checkToken(_tokens.DirectiveToken)) {
    token = this.getToken();

    if ('YAML' === token.name) {
      if (null !== this.yamlVersion) {
        throw new ParserError(null, null, "found duplicate YAML directive",
                              token.startMark);
      }

      // token.value => [major, minor]
      if (1 !== +(token.value[0])) {
        throw new ParserError(null, null, "found incompatible YAML document (version 1.* is required)",
                              token.startMark);
      }

      this.yamlVersion = token.value;
    } else if ('TAG' === token.name) {
      handle = token.value[0];
      prefix = token.value[1];

      if (undefined !== this.tagHandles[handle]) {
        throw new ParserError(null, null, "duplicate tag handle " + handle,
                              token.startMark);
      }

      this.tagHandles[handle] = prefix;
    }
  }

  if (!Object.getOwnPropertyNames(this.tagHandles).length) {
    value = [this.yamlVersion, null];
  } else {
    value = [this.yamlVersion, {}];
    Object.getOwnPropertyNames(this.tagHandles).forEach(function (key) {
      value[1][key] = this.tagHandles[key];
    }.bind(this));
  }

  Object.getOwnPropertyNames(DEFAULT_TAGS).forEach(function (key) {
    if (undefined === this.tagHandles[key]) {
      this.tagHandles[key] = DEFAULT_TAGS[key];
    }
  }.bind(this));

  return value;
};

Parser.prototype.parseBlockNode = function parseBlockNode() {
  return this.parseNode(true);
};

Parser.prototype.parseFlowNode = function parseFlowNode() {
  return this.parseNode();
};

Parser.prototype.parseBlockNodeOrIndentlessSequence = function parseBlockNodeOrIndentlessSequence() {
  return this.parseNode(true, true);
};

Parser.prototype.parseNode = function parseNode(block, indentlessSequence) {
  var token, event, anchor = null, tag = null, startMark = null,
      endMark, tagMark, handle = null, suffix = null, implicit, node;

  block = block || false;
  indentlessSequence = indentlessSequence || false;

  if (this.checkToken(_tokens.AliasToken)) {
    token = this.getToken();
    event = new _events.AliasEvent(token.value, token.startMark, token.endMark);
    this.state = this.states.pop();
  } else {
    anchor = null;
    tag = null;
    startMark = endMark = tagMark = null;

    if (this.checkToken(_tokens.AnchorToken)) {
      token = this.getToken();
      startMark = token.startMark;
      endMark = token.endMark;
      anchor = token.value;

      if (this.checkToken(_tokens.TagToken)) {
          token = this.getToken();
          tagMark = token.startMark;
          endMark = token.endMark;
          tag = token.value;
      }
    } else if (this.checkToken(_tokens.TagToken)) {
        token = this.getToken();
        startMark = tagMark = token.startMark;
        endMark = token.endMark;
        tag = token.value;

        if (this.checkToken(_tokens.AnchorToken)) {
          token = this.getToken();
          endMark = token.endMark;
          anchor = token.value;
        }
    }

    if (null !== tag) {
      handle = tag[0];
      suffix = tag[1];

      if (null === handle) {
        tag = suffix;
      } else {
        if (undefined === this.tagHandles[handle]) {
          throw new ParserError("while parsing a node", startMark,
                                "found undefined tag handle " + handle,
                                tagMark);
        }

        tag = this.tagHandles[handle] + suffix;
      }
    }

    if (null === startMark) {
      startMark = endMark = this.peekToken().startMark;
    }

    event = null;
    implicit = (null === tag || '!' === tag);

    if (indentlessSequence && this.checkToken(_tokens.BlockEntryToken)) {
      endMark = this.peekToken().endMark;
      event = new _events.SequenceStartEvent(anchor, tag, implicit,
                                        startMark, endMark);
      this.state = this.parseIndentlessSequenceEntry.bind(this);
    } else {
      if (this.checkToken(_tokens.ScalarToken)) {
          token = this.getToken();
          endMark = token.endMark;

          if ((token.plain && null === tag) || '!' === tag) {
            implicit = [true, false];
          } else if (null === tag) {
            implicit = [false, true];
          } else {
            implicit = [false, false];
          }

          event = new _events.ScalarEvent(anchor, tag, implicit, token.value,
                                     startMark, endMark, token.style);
          this.state = this.states.pop();
      } else if (this.checkToken(_tokens.FlowSequenceStartToken)) {
          endMark = this.peekToken().endMark;
          event = new _events.SequenceStartEvent(anchor, tag, implicit,
                                            startMark, endMark, true);
          this.state = this.parseFlowSequenceFirstEntry.bind(this);
      } else if (this.checkToken(_tokens.FlowMappingStartToken)) {
          endMark = this.peekToken().endMark;
          event = new _events.MappingStartEvent(anchor, tag, implicit,
                                           startMark, endMark, true);
          this.state = this.parseFlowMappingFirstKey.bind(this);
      } else if (block && this.checkToken(_tokens.BlockSequenceStartToken)) {
          endMark = this.peekToken().startMark;
          event = new _events.SequenceStartEvent(anchor, tag, implicit,
                                            startMark, endMark, false);
          this.state = this.parseBlockSequenceFirstEntry.bind(this);
      } else if (block && this.checkToken(_tokens.BlockMappingStartToken)) {
          endMark = this.peekToken().startMark;
          event = new _events.MappingStartEvent(anchor, tag, implicit,
                                           startMark, endMark, false);
          this.state = this.parseBlockMappingFirstKey.bind(this);
      } else if (null !== anchor || null !== tag) {
          // Empty scalars are allowed even if a tag or an anchor is
          // specified.
          event = new _events.ScalarEvent(anchor, tag, [implicit, false], '',
                                     startMark, endMark);
          this.state = this.states.pop();
      } else {
        node = !!block ? 'block' : 'flow';
        token = this.peekToken();
        throw new ParserError("while parsing a " + node + " node", startMark,
                  "expected the node content, but found " + token.constructor.id,
                  token.startMark);
      }
    }
  }

  return event;
};

Parser.prototype.parseBlockSequenceFirstEntry = function parseBlockSequenceFirstEntry() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseBlockSequenceEntry();
};

Parser.prototype.parseBlockSequenceEntry = function parseBlockSequenceEntry() {
  var token, event;

  if (this.checkToken(_tokens.BlockEntryToken)) {
      token = this.getToken();

      if (!this.checkToken(_tokens.BlockEntryToken, _tokens.BlockEndToken)) {
          this.states.push(this.parseBlockSequenceEntry.bind(this));
          return this.parseBlockNode();
      }

      this.state = this.parseBlockSequenceEntry.bind(this);
      return this.processEmptyScalar(token.endMark);
  }

  if (!this.checkToken(_tokens.BlockEndToken)) {
    token = this.peekToken();
    throw new ParserError("while parsing a block collection", this.marks[this.marks.length - 1],
                          "expected <block end>, but found " + token.constructor.id,
                          token.startMark);
  }

  token = this.getToken();
  event = new _events.SequenceEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseIndentlessSequenceEntry = function parseIndentlessSequenceEntry() {
  var token, event;

  if (this.checkToken(_tokens.BlockEntryToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.BlockEntryToken, _tokens.KeyToken,
                         _tokens.ValueToken, _tokens.BlockEndToken)) {
        this.states.push(this.parseIndentlessSequenceEntry.bind(this));
        return this.parseBlockNode();
    }

    this.state = this.parseIndentlessSequenceEntry.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  token = this.peekToken();
  event = new _events.SequenceEndEvent(token.startMark, token.startMark);
  this.state = this.states.pop();
  return event;
};

// block_mapping     ::= BLOCK-MAPPING_START
//                       ((KEY block_node_or_indentless_sequence?)?
//                       (VALUE block_node_or_indentless_sequence?)?)*
//                       BLOCK-END

Parser.prototype.parseBlockMappingFirstKey = function parseBlockMappingFirstKey() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseBlockMappingKey();
};

Parser.prototype.parseBlockMappingKey = function parseBlockMappingKey() {
  var token, event;

  if (this.checkToken(_tokens.KeyToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.KeyToken, _tokens.ValueToken, _tokens.BlockEndToken)) {
      this.states.push(this.parseBlockMappingValue.bind(this));
      return this.parseBlockNodeOrIndentlessSequence();
    }

    this.state = this.parseBlockMappingValue.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  if (!this.checkToken(_tokens.BlockEndToken)) {
    token = this.peekToken();
    throw new ParserError("while parsing a block mapping", this.marks[this.marks.length - 1],
                          "expected <block end>, but found " + token.constructor.id,
                          token.startMark);
  }

  token = this.getToken();
  event = new _events.MappingEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseBlockMappingValue = function parseBlockMappingValue() {
  var token, event;

  if (this.checkToken(_tokens.ValueToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.KeyToken, _tokens.ValueToken, _tokens.BlockEndToken)) {
        this.states.push(this.parseBlockMappingKey.bind(this));
        return this.parseBlockNodeOrIndentlessSequence();
    }

    this.state = this.parseBlockMappingKey.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  this.state = this.parseBlockMappingKey.bind(this);
  token = this.peekToken();

  return this.processEmptyScalar(token.startMark);
};

// flow_sequence     ::= FLOW-SEQUENCE-START
//                       (flow_sequence_entry FLOW-ENTRY)*
//                       flow_sequence_entry?
//                       FLOW-SEQUENCE-END
// flow_sequence_entry   ::= flow_node | KEY flow_node? (VALUE flow_node?)?
//
// Note that while production rules for both flow_sequence_entry and
// flow_mapping_entry are equal, their interpretations are different.
// For `flow_sequence_entry`, the part `KEY flow_node? (VALUE flow_node?)?`
// generate an inline mapping (set syntax).

Parser.prototype.parseFlowSequenceFirstEntry = function parseFlowSequenceFirstEntry() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseFlowSequenceEntry(true);
};

Parser.prototype.parseFlowSequenceEntry = function parseFlowSequenceEntry(first) {
  var token, event;

  first = first || false;

  if (!this.checkToken(_tokens.FlowSequenceEndToken)) {
    if (!first) {
      if (this.checkToken(_tokens.FlowEntryToken)) {
        this.getToken();
      } else {
        token = this.peekToken();
        throw new ParserError("while parsing a flow sequence", this.marks[this.marks.length - 1],
                              "expected ',' or ']', but got " + token.constructor.id, token.startMark);
      }
    }
      
    if (this.checkToken(_tokens.KeyToken)) {
      token = this.peekToken();
      event = new _events.MappingStartEvent(null, null, true,
                                       token.startMark, token.endMark, true);
      this.state = this.parseFlowSequenceEntryMappingKey.bind(this);
      return event;
    } else if (!this.checkToken(_tokens.FlowSequenceEndToken)) {
      this.states.push(this.parseFlowSequenceEntry.bind(this));
      return this.parseFlowNode();
    }
  }

  token = this.getToken();
  event = new _events.SequenceEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseFlowSequenceEntryMappingKey = function parseFlowSequenceEntryMappingKey() {
  var token = this.getToken();

  if (!this.checkToken(_tokens.ValueToken, _tokens.FlowEntryToken, _tokens.FlowSequenceEndToken)) {
      this.states.push(this.parseFlowSequenceEntryMappingValue.bind(this));
      return this.parseFlowNode();
  }

  this.state = this.parseFlowSequenceEntryMappingValue.bind(this);
  return this.processEmptyScalar(token.endMark);
};

Parser.prototype.parseFlowSequenceEntryMappingValue = function parseFlowSequenceEntryMappingValue() {
  var token;

  if (this.checkToken(_tokens.ValueToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.FlowEntryToken, _tokens.FlowSequenceEndToken)) {
      this.states.push(this.parseFlowSequenceEntryMappingEnd.bind(this));
      return this.parseFlowNode();
    }

    this.state = this.parseFlowSequenceEntryMappingEnd.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  this.state = this.parseFlowSequenceEntryMappingEnd.bind(this);
  token = this.peekToken();
  return this.processEmptyScalar(token.startMark);
};

Parser.prototype.parseFlowSequenceEntryMappingEnd = function parseFlowSequenceEntryMappingEnd() {
  var token;

  this.state = this.parseFlowSequenceEntry.bind(this);
  token = this.peekToken();

  return new _events.MappingEndEvent(token.startMark, token.startMark);
};

// flow_mapping  ::= FLOW-MAPPING-START
//                   (flow_mapping_entry FLOW-ENTRY)*
//                   flow_mapping_entry?
//                   FLOW-MAPPING-END
// flow_mapping_entry    ::= flow_node | KEY flow_node? (VALUE flow_node?)?

Parser.prototype.parseFlowMappingFirstKey = function parseFlowMappingFirstKey() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseFlowMappingKey(true);
};

Parser.prototype.parseFlowMappingKey = function parseFlowMappingKey(first) {
  var token, event;

  first = first || false;

  if (!this.checkToken(_tokens.FlowMappingEndToken)) {
    if (!first) {
      if (this.checkToken(_tokens.FlowEntryToken)) {
        this.getToken();
      } else {
        token = this.peekToken();
        throw new ParserError("while parsing a flow mapping", this.marks[this.marks.length - 1],
                              "expected ',' or '}', but got " + token.constructor.id, token.startMark);
      }
    }

    if (this.checkToken(_tokens.KeyToken)) {
      token = this.getToken();

      if (!this.checkToken(_tokens.ValueToken, _tokens.FlowEntryToken, _tokens.FlowMappingEndToken)) {
        this.states.push(this.parseFlowMappingValue.bind(this));
        return this.parseFlowNode();
      }

      this.state = this.parseFlowMappingValue.bind(this);
      return this.processEmptyScalar(token.endMark);
    } else if (!this.checkToken(_tokens.FlowMappingEndToken)) {
      this.states.push(this.parseFlowMappingEmptyValue.bind(this));
      return this.parseFlowNode();
    }
  }

  token = this.getToken();
  event = new _events.MappingEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseFlowMappingValue = function parseFlowMappingValue() {
  var token;

  if (this.checkToken(_tokens.ValueToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.FlowEntryToken, _tokens.FlowMappingEndToken)) {
      this.states.push(this.parseFlowMappingKey.bind(this));
      return this.parseFlowNode();
    }

    this.state = this.parseFlowMappingKey.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  this.state = this.parseFlowMappingKey.bind(this);
  token = this.peekToken();
  return this.processEmptyScalar(token.startMark);
};

Parser.prototype.parseFlowMappingEmptyValue = function parseFlowMappingEmptyValue() {
  this.state = this.parseFlowMappingKey.bind(this);
  return this.processEmptyScalar(this.peekToken().startMark);
};

Parser.prototype.processEmptyScalar = function processEmptyScalar(mark) {
  return new _events.ScalarEvent(null, null, [true, false], '', mark, mark);
};


module.exports.Parser = Parser;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/events.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');


var HASHIFY_KEYS = ['anchor', 'tag', 'implicit', 'value'];


function Event(startMark, endMark) {
  this.startMark = startMark || null;
  this.endMark = endMark || null;
}

Event.prototype.hash = Event.prototype.toString = function toString() {
  var self = this, values = [];

  Object.getOwnPropertyNames(this).forEach(function (key) {
    if (0 <= HASHIFY_KEYS.indexOf(key)) {
      values.push(key + '=' + self[key]);
    }
  });

  return this.constructor.name + '(' + values.join(', ') + ')';
};


function NodeEvent(anchor, startMark, endMark) {
  Event.call(this, startMark, endMark);
  this.anchor = anchor;
}
$$.inherits(NodeEvent, Event);


function CollectionStartEvent(anchor, tag, implicit, startMark, endMark, flowStyle) {
  NodeEvent.call(this, anchor, startMark, endMark);
  this.tag = tag;
  this.implicit = implicit;
  this.flowStyle = flowStyle || null;
}
$$.inherits(CollectionStartEvent, NodeEvent);


function CollectionEndEvent() { Event.apply(this, arguments); }
$$.inherits(CollectionEndEvent, Event);


function StreamStartEvent(startMark, endMark, encoding) {
  Event.call(this, startMark, endMark);
  this.encoding = encoding || null;
}
$$.inherits(StreamStartEvent, Event);


function StreamEndEvent() { Event.apply(this, arguments); }
$$.inherits(StreamEndEvent, Event);


function DocumentStartEvent(startMark, endMark, explicit, version, tags) {
  Event.call(this, startMark, endMark);
  this.explicit = explicit || null;
  this.version = version || null;
  this.tags = tags || null;
}
$$.inherits(DocumentStartEvent, Event);


function DocumentEndEvent(startMark, endMark, explicit) {
  Event.call(this, startMark, endMark);
  this.explicit = explicit || null;
}
$$.inherits(DocumentEndEvent, Event);


function AliasEvent() { NodeEvent.apply(this, arguments); }
$$.inherits(AliasEvent, NodeEvent);


function ScalarEvent(anchor, tag, implicit, value, startMark, endMark, style) {
  NodeEvent.call(this, anchor, startMark, endMark);
  this.tag = tag;
  this.implicit = implicit;
  this.value = value;
  this.style = style || null;
}
$$.inherits(ScalarEvent, NodeEvent);


function SequenceStartEvent() { CollectionStartEvent.apply(this, arguments); }
$$.inherits(SequenceStartEvent, CollectionStartEvent);


function SequenceEndEvent() { CollectionEndEvent.apply(this, arguments); }
$$.inherits(SequenceEndEvent, CollectionEndEvent);


function MappingStartEvent() { CollectionStartEvent.apply(this, arguments); }
$$.inherits(MappingStartEvent, CollectionStartEvent);


function MappingEndEvent() { CollectionEndEvent.apply(this, arguments); }
$$.inherits(MappingEndEvent, CollectionEndEvent);


module.exports.NodeEvent = NodeEvent;
module.exports.CollectionStartEvent = CollectionStartEvent;
module.exports.CollectionEndEvent = CollectionEndEvent;
module.exports.StreamStartEvent = StreamStartEvent;
module.exports.StreamEndEvent = StreamEndEvent;
module.exports.DocumentStartEvent = DocumentStartEvent;
module.exports.DocumentEndEvent = DocumentEndEvent;
module.exports.AliasEvent = AliasEvent;
module.exports.ScalarEvent = ScalarEvent;
module.exports.SequenceStartEvent = SequenceStartEvent;
module.exports.SequenceEndEvent = SequenceEndEvent;
module.exports.MappingStartEvent = MappingStartEvent;
module.exports.MappingEndEvent = MappingEndEvent;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/composer.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');
var _nodes = require('./nodes');
var _events = require('./events');
var _errors = require('./errors');


function ComposerError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ComposerError';
}
$$.inherits(ComposerError, _errors.MarkedYAMLError);


function Composer() {
  this.anchors = {};
}


Composer.prototype.checkNode = function checkNode() {
  // Drop the STREAM-START event
  if (this.checkEvent(_events.StreamStartEvent)) {
    this.getEvent();
  }

  // If there are more documents vailable?
  return !this.checkEvent(_events.StreamEndEvent);
};

Composer.prototype.getNode = function getNode() {
  // Get the root node of the next document.
  if (!this.checkEvent(_events.StreamEndEvent)) {
    return this.composeDocument();
  }

  return null;
};

Composer.prototype.getSingleNode = function getSingleNode() {
  var document = null;

  // Drop the STREAM-START event.
  this.getEvent();

  // Compose a document if the stream is not empty.
  if (!this.checkEvent(_events.StreamEndEvent)) {
    document = this.composeDocument();
  }

  // Ensure that the stream contains no more documents.
  if (!this.checkEvent(_events.StreamEndEvent)) {
    throw new ComposerError("expected a single document in the stream",
            document.startMark, "but found another document",
            this.getEvent().startMark);
  }

  // Drop the STREAM-END event.
  this.getEvent();

  return document;
};

Composer.prototype.composeDocument = function composeDocument() {
  var node;

  // Drop the DOCUMENT-START event.
  this.getEvent();

  // Compose the root node.
  node = this.composeNode(null, null);

  // Drop the DOCUMENT-END event.
  this.getEvent();

  this.anchors = {};

  return node;
};

Composer.prototype.composeNode = function composeNode(parent, index) {
  var node = null, event, anchor;

  if (this.checkEvent(_events.AliasEvent)) {
    event = this.getEvent();
    anchor = event.anchor;

    if (undefined === this.anchors[anchor]) {
      throw new ComposerError(null, null, "found undefined alias " + anchor,
                              event.startMark);
    }

    return this.anchors[anchor];
  }

  event = this.peekEvent();
  anchor = event.anchor;

  if (null !== anchor && undefined !== this.anchors[anchor]) {
    throw new ComposerError("found duplicate anchor " + anchor + "; first occurence",
                            this.anchors[anchor].startMark, "second occurence",
                            event.startMark);
  }

  if (this.checkEvent(_events.ScalarEvent)) {
    node = this.composeScalarNode(anchor);
  } else if (this.checkEvent(_events.SequenceStartEvent)) {
    node = this.composeSequenceNode(anchor);
  } else if (this.checkEvent(_events.MappingStartEvent)) {
    node = this.composeMappingNode(anchor);
  }

  return node;
};

Composer.prototype.composeScalarNode = function composeScalarNode(anchor) {
  var event, tag, node;

  event = this.getEvent();
  tag = event.tag;

  if (null === tag) {
    tag = this.resolve(_nodes.ScalarNode, event.value, event.implicit);
  } else if ("!" === tag) {
    tag = this.resolve(_nodes.ScalarNode, event.value, false);
  }

  node = new _nodes.ScalarNode(tag, event.value, event.startMark, event.endMark,
                           event.style);

  if (null !== anchor) {
    this.anchors[anchor] = node;
  }

  return node;
};

Composer.prototype.composeSequenceNode = function composeSequenceNode(anchor) {
  var start_event, event, tag, node, index, end_event;

  start_event = this.getEvent();
  tag = start_event.tag;

  if (null === tag) {
    tag = this.resolve(_nodes.SequenceNode, null, start_event.implicit);
  } else if ("!" === tag) {
    tag = this.resolve(_nodes.SequenceNode, null, false);
  }

  node = new _nodes.SequenceNode(tag, [], start_event.startMark, null,
                             start_event.flowStyle);

  if (null !== anchor) {
    this.anchors[anchor] = node;
  }

  index = 0;

  while (!this.checkEvent(_events.SequenceEndEvent)) {
    node.value.push(this.composeNode(node, index));
    index += 1;
  }

  end_event = this.getEvent();
  node.endMark = end_event.endMark;

  return node;
};


Composer.prototype.composeMappingNode = function composeMappingNode(anchor) {
  var startEvent, event, tag, node, itemKey, itemValue, endEvent;

  startEvent = this.getEvent();
  tag = startEvent.tag;

  if (null === tag) {
    tag = this.resolve(_nodes.MappingNode, null, startEvent.implicit);
  } else if ("!" === tag) {
    tag = this.resolve(_nodes.MappingNode, null, false);
  }

  node = new _nodes.MappingNode(tag, [], startEvent.startMark, null,
                            startEvent.flowStyle);

  if (null !== anchor) {
    this.anchors[anchor] = node;
  }

  while (!this.checkEvent(_events.MappingEndEvent)) {
    itemKey = this.composeNode(node, null);
    itemValue = this.composeNode(node, itemKey);
    node.value.push([itemKey, itemValue]);
  }

  endEvent = this.getEvent();
  node.endMark = endEvent.endMark;

  return node;
};


module.exports.Composer = Composer;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/nodes.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');


function GenericNode(tag, value, startMark, endMark) {
  this.tag = tag;
  this.value = value;
  this.startMark = startMark || null;
  this.endMark = endMark || null;
}

GenericNode.prototype.hash =
GenericNode.prototype.toString = function toString() {
  var value = this.value.toString();
  return this.constructor.name + '(' + this.tag + ', ' + value + ')';
};


function ScalarNode(tag, value, startMark, endMark, style) {
  GenericNode.call(this, tag, value, startMark, endMark);
  this.style = style || null;
}
$$.inherits(ScalarNode, GenericNode);
ScalarNode.id = 'scalar';


function CollectionNode(tag, value, startMark, endMark, flowStyle) {
  GenericNode.call(this, tag, value, startMark, endMark);
  this.flowStyle = flowStyle || null;
}
$$.inherits(CollectionNode, GenericNode);


function SequenceNode() { CollectionNode.apply(this, arguments); }
$$.inherits(SequenceNode, CollectionNode);
SequenceNode.id = 'sequence';


function MappingNode() { CollectionNode.apply(this, arguments); }
$$.inherits(MappingNode, CollectionNode);
MappingNode.id = 'mapping';


module.exports.ScalarNode = ScalarNode;
module.exports.SequenceNode = SequenceNode;
module.exports.MappingNode = MappingNode;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/resolver.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');
var _nodes = require('./nodes');


var DEFAULT_SCALAR_TAG = 'tag:yaml.org,2002:str';
var DEFAULT_SEQUENCE_TAG = 'tag:yaml.org,2002:seq';
var DEFAULT_MAPPING_TAG = 'tag:yaml.org,2002:map';


function BaseResolver() {
  this.resolverExactPaths = [];
  this.resolverPrefixPaths = [];
  this.yamlImplicitResolvers = BaseResolver.yamlImplicitResolvers;
}

BaseResolver.yamlImplicitResolvers = {};
BaseResolver.addImplicitResolver = function addImplicitResolver(tag, regexp, first) {
  var self = this;

  if (undefined === first) {
    first = [null];
  }

  first.forEach(function (ch) {
    if (undefined === self.yamlImplicitResolvers[ch]) {
      self.yamlImplicitResolvers[ch] = [];
    }

    self.yamlImplicitResolvers[ch].push([tag, regexp]);
  });
};

BaseResolver.prototype.resolve = function resolve(kind, value, implicit) {
  var resolvers, i, tag, regexp;

  if (kind === _nodes.ScalarNode && implicit && implicit[0]) {
    if (value === '') {
      resolvers = this.yamlImplicitResolvers[''] || [];
    } else {
      resolvers = this.yamlImplicitResolvers[value[0]] || [];
    }

    resolvers = resolvers.concat(this.yamlImplicitResolvers[null] || []);

    for (i = 0; i < resolvers.length; i += 1) {
      tag = resolvers[i][0];
      regexp = resolvers[i][1];

      if (regexp.test(value)) {
        return tag;
      }
    }
  }

  if (kind === _nodes.ScalarNode) {
    tag = DEFAULT_SCALAR_TAG;
  } else if (kind === _nodes.SequenceNode) {
    tag = DEFAULT_SEQUENCE_TAG;
  } else if (kind === _nodes.MappingNode) {
    tag = DEFAULT_MAPPING_TAG;
  } else {
    tag = null;
  }

  return tag;
};


function Resolver() {
  BaseResolver.apply(this, arguments);
  this.yamlImplicitResolvers = Resolver.yamlImplicitResolvers;
}

$$.inherits(Resolver, BaseResolver);

Resolver.yamlImplicitResolvers = {};
Resolver.addImplicitResolver = BaseResolver.addImplicitResolver;

Resolver.addImplicitResolver('tag:yaml.org,2002:bool',
  new RegExp('^(?:y|yes|Yes|YES|n|no|No|NO' +
             '|true|True|TRUE|false|False|FALSE' +
             '|on|On|ON|off|Off|OFF)$'),
  ['y', 'Y', 'n', 'N', 't', 'T', 'f', 'F', 'o', 'O']);

Resolver.addImplicitResolver('tag:yaml.org,2002:float',
  new RegExp('^(?:[-+]?(?:[0-9][0-9_]*)\\.[0-9_]*(?:[eE][-+][0-9]+)?' +
             '|\\.[0-9_]+(?:[eE][-+][0-9]+)?' +
             '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
             '|[-+]?\\.(?:inf|Inf|INF)' +
             '|\\.(?:nan|NaN|NAN))$'),
  ['-', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.']);

Resolver.addImplicitResolver('tag:yaml.org,2002:int',
  new RegExp('^(?:[-+]?0b[0-1_]+' +
             '|[-+]?0[0-7_]+' +
             '|[-+]?(?:0|[1-9][0-9_]*)' +
             '|[-+]?0x[0-9a-fA-F_]+' +
             '|[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$'),
  ['-', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

Resolver.addImplicitResolver('tag:yaml.org,2002:merge',
  new RegExp('^(?:<<)$'),
  ['<']);

Resolver.addImplicitResolver('tag:yaml.org,2002:null',
  new RegExp('^(?:~|null|Null|NULL|)$'),
  ['~', 'n', 'N', '']);

Resolver.addImplicitResolver('tag:yaml.org,2002:timestamp',
  new RegExp('^(?:[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' +
             '|[0-9][0-9][0-9][0-9]-[0-9][0-9]?-[0-9][0-9]?' +
             '(?:[Tt]|[ \\t]+)[0-9][0-9]?' +
             ':[0-9][0-9]:[0-9][0-9](?:\\.[0-9]*)?' +
             '(?:[ \\t]*(?:Z|[-+][0-9][0-9]?(?::[0-9][0-9])?))?)$'),
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

Resolver.addImplicitResolver('tag:yaml.org,2002:value',
  new RegExp('^(?:=)$'),
  ['=']);

// The following resolver is only for documentation purposes. It cannot work
// because plain scalars cannot start with '!', '&', or '*'.
Resolver.addImplicitResolver('tag:yaml.org,2002:yaml',
  new RegExp('^(?:!|&|\\*)$'),
  ['!', '&', '*']);



module.exports.BaseResolver = BaseResolver;
module.exports.Resolver = Resolver;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/lib/js-yaml/constructor.js", function (require, module, exports, __dirname, __filename) {
    'use strict';


var $$ = require('./common');
var _errors = require('./errors');
var _nodes = require('./nodes');


function ConstructorError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ConstructorError';
}
$$.inherits(ConstructorError, _errors.MarkedYAMLError);


var BOOL_VALUES = {
  'y':        true,
  'yes':      true,
  'n':        false,
  'no':       false,
  'true':     true,
  'false':    false,
  'on':       true,
  'off':      false
};


var TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'           + // [1] year
  '-([0-9][0-9]?)'                    + // [2] month
  '-([0-9][0-9]?)'                    + // [3] day
  '(?:(?:[Tt]|[ \\t]+)'               + // ...
  '([0-9][0-9]?)'                     + // [4] hour
  ':([0-9][0-9])'                     + // [5] minute
  ':([0-9][0-9])'                     + // [6] second
  '(?:\\.([0-9]*))?'                  + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)'  + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?)?$'            // [11] tz_minute
);


function BaseConstructor() {
  this.constructedObjects = new $$.Hash();
  this.recursiveObjects = new $$.Hash();
  this.statePopulators = []; // was state_generators
  this.deepConstruct = false;

  this.yamlConstructors = BaseConstructor.yamlConstructors;
}

BaseConstructor.yamlConstructors = {};
BaseConstructor.addConstructor = function addConstructor(tag, constructor) {
  this.yamlConstructors[tag] = constructor;
};

BaseConstructor.prototype.checkData = function checkData() {
  return this.checkNode();
};

BaseConstructor.prototype.getData = function getData() {
  if (this.checkNode()) {
    return this.constructDocument(this.getNode());
  }
};

BaseConstructor.prototype.getSingleData = function getSingleData() {
  var node = this.getSingleNode();
  if (null !== node) {
    return this.constructDocument(node);
  }
  return null;
};

BaseConstructor.prototype.constructDocument = function constructDocument(node) {
  var data = this.constructObject(node),
      stateIterator, statePopulators;

  stateIterator = function (populator) { populator.execute(); };

  while (!!this.statePopulators.length) {
    statePopulators = this.statePopulators;
    this.statePopulators = [];

    statePopulators.forEach(stateIterator);
  }

  this.constructedObjects = new $$.Hash();
  this.recursiveObjects = new $$.Hash();
  this.deepConstruct = false;

  return data;
};

BaseConstructor.prototype.constructObject = function constructObject(node, deep) {
  var data, old_deep, constructor, populator;

  if (this.constructedObjects.hasKey(node)) {
    return this.constructedObjects.get(node);
  }

  if (!!deep) {
    old_deep = this.deepConstruct;
    this.deepConstruct = true;
  }

  if (this.recursiveObjects.hasKey(node)) {
    throw new ConstructorError(null, null,
                "found unconstructable recursive node",
                node.startMark);
  }

  this.recursiveObjects.store(node, null);

  if (undefined !== this.yamlConstructors[node.tag]) {
    constructor = this.yamlConstructors[node.tag];
  } else {
    if (undefined !== this.yamlConstructors[null]) {
      constructor = this.yamlConstructors[null];
    } else {
      throw new ConstructorError(null, null,
                  "can't find any constructor for tag=" + node.tag,
                  node.startMark);
    }
  }

  data = constructor.call(this, node);

  if (data instanceof $$.Populator) {
    populator = data;
    data = populator.data;

    if (this.deepConstruct) {
      populator.execute();
    } else {
      this.statePopulators.push(populator);
    }
  }

  this.constructedObjects.store(node, data);
  this.recursiveObjects.remove(node);

  if (deep) {
    this.deepConstruct = old_deep;
  }

  return data;
};

BaseConstructor.prototype.constructScalar = function constructScalar(node) {
  if (!$$.isInstanceOf(node, _nodes.ScalarNode)) {
    throw new ConstructorError(null, null,
                "expected a scalar node, but found " + node.id,
                node.startMark);
  }

  return node.value;
};

BaseConstructor.prototype.constructSequence = function constructSequence(node, deep) {
  if (!$$.isInstanceOf(node, _nodes.SequenceNode)) {
    throw new ConstructorError(null, null,
                "expected a sequence node, but found " + node.id,
                node.startMark);
  }

  return node.value.map(function (child) {
    return this.constructObject(child, deep);
  }, this);
};

BaseConstructor.prototype.constructMapping = function constructMapping(node, deep) {
  var mapping;

  if (!$$.isInstanceOf(node, _nodes.MappingNode)) {
    throw new ConstructorError(null, null,
                "expected a mapping node, but found " + node.id,
                node.startMark);
  }

  mapping = {};

  $$.each(node.value, function (pair) {
    var key_node = pair[0], value_node = pair[1], key, value;

    key = this.constructObject(key_node, deep);
    // TODO: Do we need to check 
    if (undefined === key_node.hash) {
      throw new ConstructorError("while constructing a mapping", key_node.startMark,
                  "found unhashable key", key_node.startMark);
    }
    value = this.constructObject(value_node, deep);

    mapping[key] = value;
  }, this);

  return mapping;
};

BaseConstructor.prototype.constructPairs = function constructPairs(node, deep) {
  var pairs;

  if (!$$.isInstanceOf(node, _nodes.MappingNode)) {
    throw new ConstructorError(null, null,
                "expected a mapping node, but found " + node.id,
                node.startMark);
  }

  pairs = [];

  $$.each(node.value, function (pair) {
    var key, value;
    key = this.constructObject(pair[0], deep);
    value = this.constructObject(pair[1], deep);
    pairs.store(key, value);
  }, this);

  return pairs;
};


function SafeConstructor() {
  BaseConstructor.apply(this);
  this.yamlConstructors = SafeConstructor.yamlConstructors;
}

$$.inherits(SafeConstructor, BaseConstructor);

SafeConstructor.yamlConstructors = $$.extend({}, BaseConstructor.yamlConstructors);
SafeConstructor.addConstructor = BaseConstructor.addConstructor;

SafeConstructor.prototype.constructScalar = function constructScalar(node) {
  var result;

  if ($$.isInstanceOf(node, _nodes.MappingNode)) {
    $$.each(node.value, function (pair) {
      var key_node = pair[0], value_node = pair[1], value;

      if ('tag:yaml.org,2002:value' === key_node.tag) {
        result = this.constructScalar(value_node);
      }
    }, this);

    if (undefined !== result) {
      return result;
    }
  }

  return BaseConstructor.prototype.constructScalar.call(this, node);
};

SafeConstructor.prototype.flattenMapping = function flattenMapping(node) {
  var self = this, merge = [], index = 0, keyNode, valueNode, submerge,
      pushSingleValue, pushMultipleValues, submergeIterator;

  pushSingleValue = function (value) {
    merge.push(value);
  };

  pushMultipleValues = function (values) {
    values.forEach(pushSingleValue);
  };

  submergeIterator = function (subnode) {
    if (!$$.isInstanceOf(subnode, _nodes.MappingNode)) {
      throw new ConstructorError("while constructing a mapping", node.startMark,
                  "expected a mapping for merging, but found " + subnode.id,
                  subnode.startMark);
    }
    self.flattenMapping(subnode);
    submerge.push(subnode.value);
  };

  while (index < node.value.length) {
    keyNode = node.value[index][0];
    valueNode = node.value[index][1];

    if ('tag:yaml.org,2002:merge' === keyNode.tag) {
      node.value.splice(index, 1);

      if ($$.isInstanceOf(valueNode, _nodes.MappingNode)) {
        self.flattenMapping(valueNode);
        $$.each(valueNode.value, pushSingleValue);
      } else if ($$.isInstanceOf(valueNode, _nodes.SequenceNode)) {
        submerge = [];
        $$.each(valueNode.value, submergeIterator);
        $$.reverse(submerge).forEach(pushMultipleValues);
      } else {
        throw new ConstructorError("while constructing a mapping", node.startMark,
                    "expected a mapping or list of mappings for merging, but found " + valueNode.id,
                    valueNode.startMark);
      }
    } else if ('tag:yaml.org,2002:value' === keyNode.tag) {
      keyNode.tag = 'tag:yaml.org,2002:str';
      index += 1;
    } else {
      index += 1;
    }
  }

  if (!!merge.length) {
    $$.each(node.value, function (value) { merge.push(value); });
    node.value = merge;
  }
};

SafeConstructor.prototype.constructMapping = function constructMapping(node, deep) {
  if ($$.isInstanceOf(node, _nodes.MappingNode)) {
    this.flattenMapping(node);
  }
  return BaseConstructor.prototype.constructMapping.call(this, node);
};

SafeConstructor.prototype.constructYamlNull = function constructYamlNull(node) {
  this.constructScalar(node);
  return null;
};

SafeConstructor.prototype.constructYamlBool = function constructYamlBool(node) {
  var value = this.constructScalar(node);
  return BOOL_VALUES[value.toLowerCase()];
};

SafeConstructor.prototype.constructYamlInt = function constructYamlInt(node) {
  var value = this.constructScalar(node).replace(/_/g, ''),
      sign = ('-' === value[0]) ? -1 : 1,
      base, digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('0' === value) {
    return 0;
  } else if (/^0b/.test(value)) {
    return sign * parseInt(value.slice(2), 2);
  } else if (/^0x/.test(value)) {
    return sign * parseInt(value, 16);
  } else if ('0' === value[0]) {
    return sign * parseInt(value, 8);
  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseInt(v, 10));
    });
    value = 0;
    base = 1;
    digits.forEach(function (d) {
      value += (d * base);
      base *= 60;
    });
    return sign * value;
  } else {
    return sign * parseInt(value, 10);
  }
};

SafeConstructor.prototype.constructYamlFloat = function constructYamlFloat(node) {
  var value = this.constructScalar(node).replace(/_/g, ''),
      sign = ('-' === value[0]) ? -1 : 1,
      base, digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('.inf' === value) {
    return (1 === sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if ('.nan' === value) {
    return NaN;
  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseFloat(v, 10));
    });
    value = 0.0;
    base = 1;
    digits.forEach(function (d) {
      value += d * base;
      base *= 60;
    });
    return sign * value;
  } else {
    return sign * parseFloat(value, 10);
  }
};

SafeConstructor.prototype.constructYamlBinary = function constructYamlBinary(node) {
  try {
    return $$.decodeBase64(this.constructScalar(node));
  } catch (err) {
    throw new ConstructorError(null, null,
                "failed to decode base64 data: " + err.toString(), node.startMark);
  }
};

SafeConstructor.prototype.constructYamlTimestamp = function constructYamlTimestamp(node) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, data;

  match = TIMESTAMP_REGEXP.exec(this.constructScalar(node));

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(year, month, day);
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (!!match[7]) {
    fraction = match[7].slice(0,3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (!!match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if ('-' === match[9]) {
      delta = -delta;
    }
  }

  data = new Date(year, month, day, hour, minute, second, fraction);

  if (!!delta) {
    data.setTime(data.getTime() - delta);
  }

  return data;
};

SafeConstructor.prototype.constructYamlOmap = function constructYamlOmap(node) {
  var self = this, omap = [];
  return $$.Populator(omap, function () {
    if (!$$.isInstanceOf(node, _nodes.SequenceNode)) {
      throw new ConstructorError("while constructing an ordered map", node.startMark,
                  "expected a sequence, but found " + node.id, node.startMark);
    }

    node.value.forEach(function (subnode) {
      var data, key, value;

      if (!$$.isInstanceOf(subnode, _nodes.MappingNode)) {
        throw new ConstructorError("while constructing an ordered map", node.startMark,
                    "expected a mapping of length 1, but found " + subnode.id,
                    subnode.startMark);
      }

      if (1 !== subnode.value.length) {
        throw new ConstructorError("while constructing an ordered map", node.startMark,
                      "expected a single mapping item, but found " + subnode.value.length + " items",
                      subnode.startMark);
      }

      key = self.constructObject(subnode.value[0][0]);
      value = self.constructObject(subnode.value[0][1]);
      data = Object.create(null);

      data[key] = value;

      omap.push(data);
    });
  });
};

SafeConstructor.prototype.constructYamlPairs = function constructYamlPairs(node) {
  var self = this, pairs = [];
  return $$.Populator(pairs, function () {
    if (!$$.isInstanceOf(node, _nodes.SequenceNode)) {
       throw new ConstructorError("while constructing pairs", node.startMark,
                   "expected a sequence, but found " + node.id, node.startMark);
    }

    node.value.forEach(function (subnode) {
      var key, value;
     
      if (!$$.isInstanceOf(subnode, _nodes.MappingNode)) {
        throw new ConstructorError("while constructing pairs", node.startMark,
                    "expected a mapping of length 1, but found " + subnode.id,
                    subnode.startMark);
      }

      if (1 !== subnode.value.length) {
        throw new ConstructorError("while constructing pairs", node.startMark,
                    "expected a single mapping item, but found " + subnode.value.length + " items",
                    subnode.startMark);
      }

      key = self.constructObject(subnode.value[0][0]);
      value = self.constructObject(subnode.value[0][1]);

      pairs.push([key, value]);
    });
  });
};

SafeConstructor.prototype.constructYamlSet = function constructYamlSet(node) {
  var data = {};
  return $$.Populator(data, function () {
    $$.extend(data, this.constructMapping(node));
  }, this);
};

SafeConstructor.prototype.constructYamlStr = function constructYamlStr(node) {
  return this.constructScalar(node);
};

SafeConstructor.prototype.constructYamlSeq = function constructYamlSeq(node) {
  var data = [];
  return $$.Populator(data, function () {
    this.constructSequence(node).forEach(function (value) {
      data.push(value);
    });
  }, this);
};

SafeConstructor.prototype.constructYamlMap = function constructYamlMap(node) {
  var data = {};
  return $$.Populator(data, function () {
    $$.extend(data, this.constructMapping(node, true));
  }, this);
};

SafeConstructor.prototype.constructUndefined = function constructUndefined(node) {
  throw new ConstructorError(null, null,
              "could not determine constructor for the tag " + node.tag,
              node.startMark);
};


SafeConstructor.addConstructor(
  'tag:yaml.org,2002:null',
  SafeConstructor.prototype.constructYamlNull);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:bool',
  SafeConstructor.prototype.constructYamlBool);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:int',
  SafeConstructor.prototype.constructYamlInt);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:float',
  SafeConstructor.prototype.constructYamlFloat);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:binary',
  SafeConstructor.prototype.constructYamlBinary);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:timestamp',
  SafeConstructor.prototype.constructYamlTimestamp);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:omap',
  SafeConstructor.prototype.constructYamlOmap);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:pairs',
  SafeConstructor.prototype.constructYamlPairs);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:set',
  SafeConstructor.prototype.constructYamlSet);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:str',
  SafeConstructor.prototype.constructYamlStr);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:seq',
  SafeConstructor.prototype.constructYamlSeq);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:map',
  SafeConstructor.prototype.constructYamlMap);

SafeConstructor.addConstructor(
  null,
  SafeConstructor.prototype.constructUndefined);


function Constructor() {
  SafeConstructor.apply(this);
  this.yamlConstructors = Constructor.yamlConstructors;
}

$$.inherits(Constructor, SafeConstructor);

Constructor.yamlConstructors = $$.extend({}, SafeConstructor.yamlConstructors);
Constructor.addConstructor = SafeConstructor.addConstructor;

Constructor.prototype.constructJavascriptRegExp = function constructJavascriptRegExp(node) {
  var regexp = this.constructScalar(node),
      tail =/\/([gim]*)$/.exec(regexp),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && !!tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  return new RegExp(regexp, modifiers);
};

Constructor.prototype.constructJavascriptUndefined = function constructJavascriptUndefined(node) {
  var undef;
  return undef;
};

Constructor.prototype.constructJavascriptFunction = function constructJavascriptFunction(node) {
  /*jslint evil:true*/
  var func = new Function('return ' + this.constructScalar(node));
  return func();
};

Constructor.addConstructor(
  'tag:yaml.org,2002:js/undefined',
  Constructor.prototype.constructJavascriptUndefined);

Constructor.addConstructor(
  'tag:yaml.org,2002:js/regexp',
  Constructor.prototype.constructJavascriptRegExp);

Constructor.addConstructor(
  'tag:yaml.org,2002:js/function',
  Constructor.prototype.constructJavascriptFunction);


module.exports.BaseConstructor = BaseConstructor;
module.exports.SafeConstructor = SafeConstructor;
module.exports.Constructor = Constructor;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////

});

require.define("/index.js", function (require, module, exports, __dirname, __filename) {
    module.exports = require('./lib/js-yaml.js');

});
require("/index.js");
    return require('/lib/js-yaml');
  }());
  
  if ('function' === typeof define && define.amd) {
    define('jsyaml', [], function () { return __jsyaml__; }, 'jsyaml');
  }
  
  return __jsyaml__;
}());
