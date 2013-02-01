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

(function () {
  'use strict';

  // getOwnPropertyNames shim for IE7. Thanks to @Fanjita
  // Not using es5-shams as they give more problems. See:
  // https://github.com/nodeca/js-yaml/issues/49#issuecomment-10963606
  if ('function' !== typeof Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(obj) {
      var keys = [], k;

      // Only iterate the keys if we were given an object, and
      // a special check for null, as typeof null == "object"
      if (!!obj && 'object' === typeof obj) {
        // Use a standard for in loop
        for (k in obj) {
          // A for in will iterate over members on the prototype
          // chain as well, but Object.getOwnPropertyNames returns
          // only those directly on the object, so use hasOwnProperty.
          if (obj.hasOwnProperty(k)) {
            keys.push(k);
          }
        }
      }

      return keys;
    };
  }
}());
var jsyaml = window.jsyaml = (function () {
var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

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
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
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
            var pkgfile = path.normalize(x + '/package.json');
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
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
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

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
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

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./index.js"}
});

require.define("/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require('./lib/js-yaml.js');

});

require.define("/lib/js-yaml.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var loader = require('./js-yaml/loader');


function deprecated(name) {
  return function () {
    throw new Error('Function ' + name + ' is deprecated and cannot be used.');
  };
}


module.exports.Type           = require('./js-yaml/type');
module.exports.Schema         = require('./js-yaml/schema');
module.exports.MINIMAL_SCHEMA = require('./js-yaml/schema/minimal');
module.exports.SAFE_SCHEMA    = require('./js-yaml/schema/safe');
module.exports.DEFAULT_SCHEMA = require('./js-yaml/schema/default');
module.exports.load           = loader.load;
module.exports.loadAll        = loader.loadAll;
module.exports.safeLoad       = loader.safeLoad;
module.exports.safeLoadAll    = loader.safeLoadAll;
module.exports.YAMLException  = require('./js-yaml/exception');
module.exports.scan           = deprecated('scan');
module.exports.parse          = deprecated('parse');
module.exports.compose        = deprecated('compose');
module.exports.addConstructor = deprecated('addConstructor');


require('./js-yaml/require');

});

require.define("/lib/js-yaml/loader.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var common         = require('./common');
var YAMLException  = require('./exception');
var Mark           = require('./mark');
var NIL            = common.NIL;
var SAFE_SCHEMA    = require('./schema/safe');
var DEFAULT_SCHEMA = require('./schema/default');


var _hasOwnProperty = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var CHAR_TAB                  = 0x09;   /* Tab */
var CHAR_LINE_FEED            = 0x0A;   /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D;   /* CR */
var CHAR_SPACE                = 0x20;   /* Space */
var CHAR_EXCLAMATION          = 0x21;   /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22;   /* " */
var CHAR_SHARP                = 0x23;   /* # */
var CHAR_PERCENT              = 0x25;   /* % */
var CHAR_AMPERSAND            = 0x26;   /* & */
var CHAR_SINGLE_QUOTE         = 0x27;   /* ' */
var CHAR_ASTERISK             = 0x2A;   /* * */
var CHAR_PLUS                 = 0x2B;   /* + */
var CHAR_COMMA                = 0x2C;   /* , */
var CHAR_MINUS                = 0x2D;   /* - */
var CHAR_DOT                  = 0x2E;   /* . */
var CHAR_SLASH                = 0x2F;   /* / */
var CHAR_DIGIT_ZERO           = 0x30;   /* 0 */
var CHAR_DIGIT_ONE            = 0x31;   /* 1 */
var CHAR_DIGIT_NINE           = 0x39;   /* 9 */
var CHAR_COLON                = 0x3A;   /* : */
var CHAR_LESS_THAN            = 0x3C;   /* < */
var CHAR_GREATER_THAN         = 0x3E;   /* > */
var CHAR_QUESTION             = 0x3F;   /* ? */
var CHAR_COMMERCIAL_AT        = 0x40;   /* @ */
var CHAR_CAPITAL_A            = 0x41;   /* A */
var CHAR_CAPITAL_F            = 0x46;   /* F */
var CHAR_CAPITAL_L            = 0x4C;   /* L */
var CHAR_CAPITAL_N            = 0x4E;   /* N */
var CHAR_CAPITAL_P            = 0x50;   /* P */
var CHAR_CAPITAL_U            = 0x55;   /* U */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B;   /* [ */
var CHAR_BACKSLASH            = 0x5C;   /* \ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D;   /* ] */
var CHAR_UNDERSCORE           = 0x5F;   /* _ */
var CHAR_GRAVE_ACCENT         = 0x60;   /* ` */
var CHAR_SMALL_A              = 0x61;   /* a */
var CHAR_SMALL_B              = 0x62;   /* b */
var CHAR_SMALL_E              = 0x65;   /* e */
var CHAR_SMALL_F              = 0x66;   /* f */
var CHAR_SMALL_N              = 0x6E;   /* n */
var CHAR_SMALL_R              = 0x72;   /* r */
var CHAR_SMALL_T              = 0x74;   /* t */
var CHAR_SMALL_U              = 0x75;   /* u */
var CHAR_SMALL_V              = 0x76;   /* v */
var CHAR_SMALL_X              = 0x78;   /* x */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B;   /* { */
var CHAR_VERTICAL_LINE        = 0x7C;   /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D;   /* } */
var CHAR_BYTE_ORDER_MARK      = 0xFEFF;


var SIMPLE_ESCAPE_SEQUENCES = {};

SIMPLE_ESCAPE_SEQUENCES[CHAR_DIGIT_ZERO]   = '\x00';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_A]      = '\x07';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_B]      = '\x08';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_T]      = '\x09';
SIMPLE_ESCAPE_SEQUENCES[CHAR_TAB]          = '\x09';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_N]      = '\x0A';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_V]      = '\x0B';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_F]      = '\x0C';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_R]      = '\x0D';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_E]      = '\x1B';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SPACE]        = ' ';
SIMPLE_ESCAPE_SEQUENCES[CHAR_DOUBLE_QUOTE] = '\x22';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SLASH]        = '\\';
SIMPLE_ESCAPE_SEQUENCES[CHAR_BACKSLASH]    = '\x5C';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_N]    = '\x85';
SIMPLE_ESCAPE_SEQUENCES[CHAR_UNDERSCORE]   = '\xA0';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_L]    = '\u2028';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_P]    = '\u2029';


var HEXADECIMAL_ESCAPE_SEQUENCES = {};

HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_SMALL_X]   = 2;
HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_SMALL_U]   = 4;
HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_CAPITAL_U] = 8;


var PATTERN_NON_PRINTABLE         = /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uD800-\uDFFF\uFFFE\uFFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function loadAll(input, output, settings) {
  var name     = common.getOption(settings, 'name',     null),
      schema   = common.getOption(settings, 'schema',   DEFAULT_SCHEMA),
      validate = common.getOption(settings, 'validate', true),
      strict   = common.getOption(settings, 'strict',   false),
      legacy   = common.getOption(settings, 'legacy',   false),

      directiveHandlers = {},
      implicitTypes     = schema.compileImplicit(null),
      explicitTypes     = schema.compileExplicit(null),
      
      length     = input.length,
      position   = 0,
      line       = 0,
      lineStart  = 0,
      lineIndent = 0,
      character  = input.charCodeAt(position),
      
      version,
      checkLineBreaks,
      tagMap,
      anchorMap,
      tag,
      anchor,
      result;

  function generateError(message) {
    return new YAMLException(
      message,
      new Mark(name, input, position, line, (position - lineStart)));
  }

  function throwError(message) {
    throw generateError(message);
  }

  function throwWarning(message) {
    var error = generateError(message);

    if (strict) {
      throw error;
    } else {
      console.warn(error.toString());
    }
  }

  directiveHandlers['YAML'] = function handleYamlDirective(name, args) {
    var match, major, minor;

    if (null !== version) {
      throwError('duplication of %YAML directive');
    }

    if (1 !== args.length) {
      throwError('YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (null === match) {
      throwError('ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (1 !== major) {
      throwError('unacceptable YAML version of the document');
    }

    version = args[0];
    checkLineBreaks = (minor < 2);

    if (1 !== minor && 2 !== minor) {
      throwWarning('unsupported YAML version of the document');
    }
  };

  directiveHandlers['TAG'] = function handleTagDirective(name, args) {
    var handle, prefix;

    if (2 !== args.length) {
      throwError('TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError('ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty.call(tagMap, handle)) {
      throwError('there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError('ill-formed tag prefix (second argument) of the TAG directive');
    }

    tagMap[handle] = prefix;
  };

  function captureSegment(start, end, checkJson) {
    var _position, _length, _character, _result;

    if (start < end) {
      _result = input.slice(start, end);

      if (checkJson && validate) {
        for (_position = 0, _length = _result.length;
             _position < _length;
             _position += 1) {
          _character = _result.charCodeAt(_position);
          if (!(0x09 === _character ||
                0x20 <= _character && _character <= 0x10FFFF)) {
            throwError('expected valid JSON character');
          }
        }
      }

      result += _result;
    }
  }

  function mergeMappings(destination, source) {
    var sourceKeys, key, index, quantity;

    if (!common.isObject(source)) {
      throwError('cannot merge mappings; the provided source object is unacceptable');
    }

    sourceKeys = Object.keys(source);
    
    for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      key = sourceKeys[index];

      if (!_hasOwnProperty.call(destination, key)) {
        destination[key] = source[key];
      }
    }
  }

  function storeMappingPair(_result, keyTag, keyNode, valueNode) {
    var index, quantity;

    keyNode = String(keyNode);

    if (null === _result) {
      _result = {};
    }

    if ('tag:yaml.org,2002:merge' === keyTag) {
      if (Array.isArray(valueNode)) {
        for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(_result, valueNode[index]);
        }
      } else {
        mergeMappings(_result, valueNode);
      }
    } else {
      _result[keyNode] = valueNode;
    }
    
    return _result;
  }

  function readLineBreak() {
    if (CHAR_LINE_FEED === character) {
      position += 1;
    } else if (CHAR_CARRIAGE_RETURN === character) {
      if (CHAR_LINE_FEED === input.charCodeAt(position + 1)) {
        position += 2;
      } else {
        position += 1;
      }
    } else {
      throwError('a line break is expected');
    }

    line += 1;
    lineStart = position;
    character = input.charCodeAt(position);
  }

  function skipSeparationSpace(allowComments, checkIndent) {
    var lineBreaks = 0;

    while (position < length) {
      while (CHAR_SPACE === character || CHAR_TAB === character) {
        character = input.charCodeAt(++position);
      }

      if (allowComments && CHAR_SHARP === character) {
        do { character = input.charCodeAt(++position); }
        while (position < length &&
               CHAR_LINE_FEED !== character &&
               CHAR_CARRIAGE_RETURN !== character);
      }

      if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        readLineBreak();
        lineBreaks += 1;
        lineIndent = 0;

        while (CHAR_SPACE === character) {
          lineIndent += 1;
          character = input.charCodeAt(++position);
        }

        if (lineIndent < checkIndent) {
          throwWarning('deficient indentation');
        }
      } else {
        break;
      }
    }

    return lineBreaks;
  }

  function testDocumentSeparator() {
    var _position, _character;
    
    if (position === lineStart &&
        (CHAR_MINUS === character || CHAR_DOT === character) &&
        input.charCodeAt(position + 1) === character &&
        input.charCodeAt(position + 2) === character) {

      _position = position + 3;
      _character = input.charCodeAt(_position);

      if (_position >= length ||
          CHAR_SPACE           === _character ||
          CHAR_TAB             === _character ||
          CHAR_LINE_FEED       === _character ||
          CHAR_CARRIAGE_RETURN === _character) {
        return true;
      }
    }

    return false;
  }

  function writeFoldedLines(count) {
    if (1 === count) {
      result += ' ';
    } else if (count > 1) {
      result += common.repeat('\n', count - 1);
    }
  }

  function readPlainScalar(nodeIndent, withinFlowCollection) {
    var preceding,
        following,
        captureStart,
        captureEnd,
        hasPendingContent,
        _line,
        _lineStart,
        _lineIndent,
        _result = result;

    if (CHAR_SPACE                === character ||
        CHAR_TAB                  === character ||
        CHAR_LINE_FEED            === character ||
        CHAR_CARRIAGE_RETURN      === character ||
        CHAR_COMMA                === character ||
        CHAR_LEFT_SQUARE_BRACKET  === character ||
        CHAR_RIGHT_SQUARE_BRACKET === character ||
        CHAR_LEFT_CURLY_BRACKET   === character ||
        CHAR_RIGHT_CURLY_BRACKET  === character ||
        CHAR_SHARP                === character ||
        CHAR_AMPERSAND            === character ||
        CHAR_ASTERISK             === character ||
        CHAR_EXCLAMATION          === character ||
        CHAR_VERTICAL_LINE        === character ||
        CHAR_GREATER_THAN         === character ||
        CHAR_SINGLE_QUOTE         === character ||
        CHAR_DOUBLE_QUOTE         === character ||
        CHAR_PERCENT              === character ||
        CHAR_COMMERCIAL_AT        === character ||
        CHAR_GRAVE_ACCENT         === character) {
      return false;
    }

    if (CHAR_QUESTION === character ||
        CHAR_MINUS === character) {
      following = input.charCodeAt(position + 1);

      if (CHAR_SPACE                 === following ||
          CHAR_TAB                   === following ||
          CHAR_LINE_FEED             === following ||
          CHAR_CARRIAGE_RETURN       === following ||
          withinFlowCollection &&
          (CHAR_COMMA                === following ||
           CHAR_LEFT_SQUARE_BRACKET  === following ||
           CHAR_RIGHT_SQUARE_BRACKET === following ||
           CHAR_LEFT_CURLY_BRACKET   === following ||
           CHAR_RIGHT_CURLY_BRACKET  === following)) {
        return false;
      }
    }

    result = '';
    captureStart = captureEnd = position;
    hasPendingContent = false;

    while (position < length) {
      if (CHAR_COLON === character) {
        following = input.charCodeAt(position + 1);
     
        if (CHAR_SPACE                 === following ||
            CHAR_TAB                   === following ||
            CHAR_LINE_FEED             === following ||
            CHAR_CARRIAGE_RETURN       === following ||
            withinFlowCollection &&
            (CHAR_COMMA                === following ||
             CHAR_LEFT_SQUARE_BRACKET  === following ||
             CHAR_RIGHT_SQUARE_BRACKET === following ||
             CHAR_LEFT_CURLY_BRACKET   === following ||
             CHAR_RIGHT_CURLY_BRACKET  === following)) {
          break;
        }

      } else if (CHAR_SHARP === character) {
        preceding = input.charCodeAt(position - 1);

        if (CHAR_SPACE           === preceding ||
            CHAR_TAB             === preceding ||
            CHAR_LINE_FEED       === preceding ||
            CHAR_CARRIAGE_RETURN === preceding) {
          break;
        }
        
      } else if ((position === lineStart && testDocumentSeparator()) ||
                 withinFlowCollection &&
                 (CHAR_COMMA                === character ||
                  CHAR_LEFT_SQUARE_BRACKET  === character ||
                  CHAR_RIGHT_SQUARE_BRACKET === character ||
                  CHAR_LEFT_CURLY_BRACKET   === character ||
                  CHAR_RIGHT_CURLY_BRACKET  === character)) {
        break;

      } else if (CHAR_LINE_FEED === character ||
                 CHAR_CARRIAGE_RETURN === character) {
        _line = line;
        _lineStart = lineStart;
        _lineIndent = lineIndent;
        skipSeparationSpace(false, -1);

        if (lineIndent >= nodeIndent) {
          hasPendingContent = true;
          continue;
        } else {
          position = captureEnd;
          line = _line;
          lineStart = _lineStart;
          lineIndent = _lineIndent;
          character = input.charCodeAt(position);
          break;
        }
      }

      if (hasPendingContent) {
        captureSegment(captureStart, captureEnd, false);
        writeFoldedLines(line - _line);
        captureStart = captureEnd = position;
        hasPendingContent = false;
      }

      if (CHAR_SPACE !== character && CHAR_TAB !== character) {
        captureEnd = position + 1;
      }

      character = input.charCodeAt(++position);
    }

    captureSegment(captureStart, captureEnd, false);

    if (result) {
      return true;
    } else {
      result = _result;
      return false;
    }
  }

  function readSingleQuotedScalar(nodeIndent) {
    var captureStart, captureEnd;

    if (CHAR_SINGLE_QUOTE !== character) {
      return false;
    }

    result = '';
    character = input.charCodeAt(++position);
    captureStart = captureEnd = position;

    while (position < length) {
      if (CHAR_SINGLE_QUOTE === character) {
        captureSegment(captureStart, position, true);
        character = input.charCodeAt(++position);

        if (CHAR_SINGLE_QUOTE === character) {
          captureStart = captureEnd = position;
          character = input.charCodeAt(++position);
        } else {
          return true;
        }

      } else if (CHAR_LINE_FEED === character ||
                 CHAR_CARRIAGE_RETURN === character) {
        captureSegment(captureStart, captureEnd, true);
        writeFoldedLines(skipSeparationSpace(false, nodeIndent));
        captureStart = captureEnd = position;
        character = input.charCodeAt(position);

      } else if (position === lineStart && testDocumentSeparator()) {
        throwError('unexpected end of the document within a single quoted scalar');

      } else {
        character = input.charCodeAt(++position);
        captureEnd = position;
      }
    }

    throwError('unexpected end of the stream within a single quoted scalar');
  }
  
  function readDoubleQuotedScalar(nodeIndent) {
    var captureStart,
        captureEnd,
        hexLength,
        hexIndex,
        hexOffset,
        hexResult;

    if (CHAR_DOUBLE_QUOTE !== character) {
      return false;
    }

    result = '';
    character = input.charCodeAt(++position);
    captureStart = captureEnd = position;

    while (position < length) {
      if (CHAR_DOUBLE_QUOTE === character) {
        captureSegment(captureStart, position, true);
        character = input.charCodeAt(++position);
        return true;

      } else if (CHAR_BACKSLASH === character) {
        captureSegment(captureStart, position, true);
        character = input.charCodeAt(++position);

        if (CHAR_LINE_FEED       === character ||
            CHAR_CARRIAGE_RETURN === character) {
          skipSeparationSpace(false, nodeIndent);

        } else if (SIMPLE_ESCAPE_SEQUENCES[character]) {
          result += SIMPLE_ESCAPE_SEQUENCES[character];
          character = input.charCodeAt(++position);

        } else if (HEXADECIMAL_ESCAPE_SEQUENCES[character]) {
          hexLength = HEXADECIMAL_ESCAPE_SEQUENCES[character];
          hexResult = 0;

          for (hexIndex = 1; hexIndex <= hexLength; hexIndex += 1) {
            hexOffset = (hexLength - hexIndex) * 4;
            character = input.charCodeAt(++position);

            if (CHAR_DIGIT_ZERO <= character && character <= CHAR_DIGIT_NINE) {
              hexResult |= (character - CHAR_DIGIT_ZERO) << hexOffset;

            } else if (CHAR_CAPITAL_A <= character && character <= CHAR_CAPITAL_F) {
              hexResult |= (character - CHAR_CAPITAL_A + 10) << hexOffset;

            } else if (CHAR_SMALL_A <= character && character <= CHAR_SMALL_F) {
              hexResult |= (character - CHAR_SMALL_A + 10) << hexOffset;

            } else {
              throwError('expected hexadecimal character');
            }
          }

          result += String.fromCharCode(hexResult);
          character = input.charCodeAt(++position);

        } else {
          throwError('unknown escape sequence');
        }
        
        captureStart = captureEnd = position;

      } else if (CHAR_LINE_FEED === character ||
                 CHAR_CARRIAGE_RETURN === character) {
        captureSegment(captureStart, captureEnd, true);
        writeFoldedLines(skipSeparationSpace(false, nodeIndent));
        captureStart = captureEnd = position;
        character = input.charCodeAt(position);

      } else if (position === lineStart && testDocumentSeparator()) {
        throwError('unexpected end of the document within a double quoted scalar');

      } else {
        character = input.charCodeAt(++position);
        captureEnd = position;
      }
    }

    throwError('unexpected end of the stream within a double quoted scalar');
  }

  function readFlowCollection(nodeIndent) {
    var readNext = true,
        _line,
        _tag     = tag,
        _result,
        following,
        terminator,
        isPair,
        isExplicitPair,
        isMapping,
        keyNode,
        keyTag,
        valueNode;

    switch (character) {
    case CHAR_LEFT_SQUARE_BRACKET:
      terminator = CHAR_RIGHT_SQUARE_BRACKET;
      isMapping = false;
      _result = [];
      break;

    case CHAR_LEFT_CURLY_BRACKET:
      terminator = CHAR_RIGHT_CURLY_BRACKET;
      isMapping = true;
      _result = {};
      break;

    default:
      return false;
    }

    if (null !== anchor) {
      anchorMap[anchor] = _result;
    }

    character = input.charCodeAt(++position);

    while (position < length) {
      skipSeparationSpace(true, nodeIndent);

      if (character === terminator) {
        character = input.charCodeAt(++position);
        tag = _tag;
        result = _result;
        return true;
      } else if (!readNext) {
        throwError('missed comma between flow collection entries');
      }

      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;

      if (CHAR_QUESTION === character) {
        following = input.charCodeAt(position + 1);

        if (CHAR_SPACE === following ||
            CHAR_TAB === following ||
            CHAR_LINE_FEED === following ||
            CHAR_CARRIAGE_RETURN === following) {
          isPair = isExplicitPair = true;
          position += 1;
          character = following;
          skipSeparationSpace(true, nodeIndent);
        }
      }

      _line = line;
      composeNode(nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = tag;
      keyNode = result;

      if ((isExplicitPair || line === _line) && CHAR_COLON === character) {
        isPair = true;
        character = input.charCodeAt(++position);
        skipSeparationSpace(true, nodeIndent);
        composeNode(nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = result;
      }

      if (isMapping) {
        storeMappingPair(_result, keyTag, keyNode, valueNode);
      } else if (isPair) {
        _result.push(storeMappingPair(null, keyTag, keyNode, valueNode));
      } else {
        _result.push(keyNode);
      }

      skipSeparationSpace(true, nodeIndent);

      if (CHAR_COMMA === character) {
        readNext = true;
        character = input.charCodeAt(++position);
      } else {
        readNext = false;
      }
    }

    throwError('unexpected end of the stream within a flow collection');
  }

  function readBlockScalar(nodeIndent) {
    var captureStart,
        folding,
        chomping       = CHOMPING_CLIP,
        detectedIndent = false,
        textIndent     = nodeIndent,
        emptyLines     = -1;

    switch (character) {
    case CHAR_VERTICAL_LINE:
      folding = false;
      break;

    case CHAR_GREATER_THAN:
      folding = true;
      break;

    default:
      return false;
    }

    result = '';

    while (position < length) {
      character = input.charCodeAt(++position);

      if (CHAR_PLUS === character || CHAR_MINUS === character) {
        if (CHOMPING_CLIP === chomping) {
          chomping = (CHAR_PLUS === character) ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError('repeat of a chomping mode identifier');
        }

      } else if (CHAR_DIGIT_ZERO <= character && character <= CHAR_DIGIT_NINE) {
        if (CHAR_DIGIT_ZERO === character) {
          throwError('bad explicit indentation width of a block scalar; it cannot be less than one');
        } else if (!detectedIndent) {
          textIndent = nodeIndent + (character - CHAR_DIGIT_ONE);
          detectedIndent = true;
        } else {
          throwError('repeat of an indentation width identifier');
        }

      } else {
        break;
      }
    }

    if (CHAR_SPACE === character || CHAR_TAB === character) {
      do { character = input.charCodeAt(++position); }
      while (CHAR_SPACE === character || CHAR_TAB === character);

      if (CHAR_SHARP === character) {
        do { character = input.charCodeAt(++position); }
        while (position < length &&
               CHAR_LINE_FEED !== character &&
               CHAR_CARRIAGE_RETURN !== character);
      }
    }
      
    while (position < length) {
      readLineBreak();
      lineIndent = 0;

      while ((!detectedIndent || lineIndent < textIndent) &&
             (CHAR_SPACE === character)) {
        lineIndent += 1;
        character = input.charCodeAt(++position);
      }

      if (!detectedIndent && lineIndent > textIndent) {
        textIndent = lineIndent;
      }

      if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
        emptyLines += 1;
        continue;
      }

      // End of the scalar. Perform the chomping.
      if (lineIndent < textIndent) {
        if (CHOMPING_KEEP === chomping) {
          result += common.repeat('\n', emptyLines + 1);
        } else if (CHOMPING_CLIP === chomping) {
          result += '\n';
        }
        break;
      }

      detectedIndent = true;

      if (folding) {
        if (CHAR_SPACE === character || CHAR_TAB === character) {
          result += common.repeat('\n', emptyLines + 1);
          emptyLines = 1;
        } else if (0 === emptyLines) {
          result += ' ';
          emptyLines = 0;
        } else {
          result += common.repeat('\n', emptyLines);
          emptyLines = 0;
        }
      } else {
        result += common.repeat('\n', emptyLines + 1);
        emptyLines = 0;
      }

      captureStart = position;

      do { character = input.charCodeAt(++position); }
      while (position < length &&
             CHAR_LINE_FEED !== character &&
             CHAR_CARRIAGE_RETURN !== character);

      captureSegment(captureStart, position, false);
    }

    return true;
  }

  function readBlockSequence(nodeIndent) {
    var _line,
        _tag      = tag,
        _result   = [],
        following,
        detected  = false;

    if (null !== anchor) {
      anchorMap[anchor] = _result;
    }

    while (position < length) {
      if (CHAR_MINUS !== character) {
        break;
      }

      following = input.charCodeAt(position + 1);

      if (CHAR_SPACE           !== following &&
          CHAR_TAB             !== following &&
          CHAR_LINE_FEED       !== following &&
          CHAR_CARRIAGE_RETURN !== following) {
        break;
      }

      detected = true;
      position += 1;
      character = following;

      if (skipSeparationSpace(true, -1)) {
        if (lineIndent <= nodeIndent) {
          _result.push(null);
          continue;
        }
      }

      _line = line;
      composeNode(nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(result);
      skipSeparationSpace(true, -1);

      if ((line === _line || lineIndent > nodeIndent) && position < length) {
        throwError('bad indentation of a sequence entry');
      } else if (lineIndent < nodeIndent) {
        break;
      }
    }

    if (detected) {
      tag = _tag;
      result = _result;
      return true;
    } else {
      return false;
    }
  }

  function readBlockMapping(nodeIndent) {
    var following,
        allowCompact,
        _line,
        _tag          = tag,
        _result       = {},
        keyTag        = null,
        keyNode       = null,
        valueNode     = null,
        atExplicitKey = false,
        detected      = false;

    if (null !== anchor) {
      anchorMap[anchor] = _result;
    }

    while (position < length) {
      following = input.charCodeAt(position + 1);
      _line = line; // Save the current line.

      if ((CHAR_QUESTION        === character ||
           CHAR_COLON           === character) &&
          (CHAR_SPACE           === following ||
           CHAR_TAB             === following ||
           CHAR_LINE_FEED       === following ||
           CHAR_CARRIAGE_RETURN === following)) {

        if (CHAR_QUESTION === character) {
          if (atExplicitKey) {
            storeMappingPair(_result, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = true;
          allowCompact = true;

        } else if (atExplicitKey) {
          // i.e. CHAR_COLON === character after the explicit key.
          atExplicitKey = false;
          allowCompact = true;

        } else {
          throwError('incomplete explicit mapping pair; a key node is missed');
        }

        position += 1;
        character = following;

      } else if (composeNode(nodeIndent, CONTEXT_FLOW_OUT, false, true)) {
        if (line === _line) {
          // TODO: Remove this cycle when the flow readers will consume
          // trailing whitespaces like the block readers.
          while (CHAR_SPACE === character ||
                 CHAR_TAB === character) {
            character = input.charCodeAt(++position);
          }

          if (CHAR_COLON === character) {
            character = input.charCodeAt(++position);

            if (CHAR_SPACE           !== character &&
                CHAR_TAB             !== character &&
                CHAR_LINE_FEED       !== character &&
                CHAR_CARRIAGE_RETURN !== character) {
              throwError('a whitespace character is expected after the key-value separator within a block mapping');
            }

            if (atExplicitKey) {
              storeMappingPair(_result, keyTag, keyNode, null);
              keyTag = keyNode = valueNode = null;
            }

            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = tag;
            keyNode = result;

          } else if (detected) {
            throwError('can not read an implicit mapping pair; a colon is missed');

          } else {
            tag = _tag;
            return true; // Keep the result of `composeNode`.
          }

        } else if (detected) {
          throwError('can not read a block mapping entry; a multiline key may not be an implicit key');

        } else {
          tag = _tag;
          return true; // Keep the result of `composeNode`.
        }

      } else {
        break;
      }

      if (line === _line || lineIndent > nodeIndent) {
        if (composeNode(nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = result;
          } else {
            valueNode = result;
          }
        }

        if (!atExplicitKey) {
          storeMappingPair(_result, keyTag, keyNode, valueNode);
          keyTag = keyNode = valueNode = null;
        }

        // TODO: It is needed only for flow node readers. It should be removed
        // when the flow readers will consume trailing whitespaces as well as
        // the block readers.
        skipSeparationSpace(true, -1);
      }

      if (lineIndent > nodeIndent && position < length) {
        throwError('bad indentation of a mapping entry');
      } else if (lineIndent < nodeIndent) {
        break;
      }
    }

    if (atExplicitKey) {
      storeMappingPair(_result, keyTag, keyNode, null);
    }

    if (detected) {
      tag = _tag;
      result = _result;
    }

    return detected;
  }

  function readTagProperty() {
    var _position,
        isVerbatim = false,
        isNamed    = false,
        tagHandle,
        tagName;
    
    if (CHAR_EXCLAMATION !== character) {
      return false;
    }

    if (null !== tag) {
      throwError('duplication of a tag property');
    }

    character = input.charCodeAt(++position);

    if (CHAR_LESS_THAN === character) {
      isVerbatim = true;
      character = input.charCodeAt(++position);

    } else if (CHAR_EXCLAMATION === character) {
      isNamed = true;
      tagHandle = '!!';
      character = input.charCodeAt(++position);

    } else {
      tagHandle = '!';
    }

    _position = position;

    if (isVerbatim) {
      do { character = input.charCodeAt(++position); }
      while (position < length && CHAR_GREATER_THAN !== character);

      if (position < length) {
        tagName = input.slice(_position, position);
        character = input.charCodeAt(++position);
      } else {
        throwError('unexpected end of the stream within a verbatim tag');
      }
    } else {
      while (position < length &&
             CHAR_SPACE           !== character &&
             CHAR_TAB             !== character &&
             CHAR_LINE_FEED       !== character &&
             CHAR_CARRIAGE_RETURN !== character) {

        if (CHAR_EXCLAMATION === character) {
          if (!isNamed) {
            tagHandle = input.slice(_position - 1, position + 1);

            if (validate && !PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError('named tag handle cannot contain such characters');
            }

            isNamed = true;
            _position = position + 1;
          } else {
            throwError('tag suffix cannot contain exclamation marks');
          }
        }

        character = input.charCodeAt(++position);
      }

      tagName = input.slice(_position, position);

      if (validate && PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError('tag suffix cannot contain flow indicator characters');
      }
    }

    if (validate && tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError('tag name cannot contain such characters: ' + tagName);
    }

    if (isVerbatim) {
      tag = tagName;

    } else if (_hasOwnProperty.call(tagMap, tagHandle)) {
      tag = tagMap[tagHandle] + tagName;

    } else if ('!' === tagHandle) {
      tag = '!' + tagName;

    } else if ('!!' === tagHandle) {
      tag = 'tag:yaml.org,2002:' + tagName;
      
    } else {
      throwError('undeclared tag handle "' + tagHandle + '"');
    }

    return true;
  }

  function readAnchorProperty() {
    var _position;

    if (CHAR_AMPERSAND !== character) {
      return false;
    }

    if (null !== anchor) {
      throwError('duplication of an anchor property');
    }

    character = input.charCodeAt(++position);
    _position = position;

    while (position < length &&
           CHAR_SPACE                !== character &&
           CHAR_TAB                  !== character &&
           CHAR_LINE_FEED            !== character &&
           CHAR_CARRIAGE_RETURN      !== character &&
           CHAR_COMMA                !== character &&
           CHAR_LEFT_SQUARE_BRACKET  !== character &&
           CHAR_RIGHT_SQUARE_BRACKET !== character &&
           CHAR_LEFT_CURLY_BRACKET   !== character &&
           CHAR_RIGHT_CURLY_BRACKET  !== character) {
      character = input.charCodeAt(++position);
    }

    if (position === _position) {
      throwError('name of an anchor node must contain at least one character');
    }

    anchor = input.slice(_position, position);
    return true;
  }

  function readAlias() {
    var _position, alias;

    if (CHAR_ASTERISK !== character) {
      return false;
    }

    character = input.charCodeAt(++position);
    _position = position;

    while (position < length &&
           CHAR_SPACE                !== character &&
           CHAR_TAB                  !== character &&
           CHAR_LINE_FEED            !== character &&
           CHAR_CARRIAGE_RETURN      !== character &&
           CHAR_COMMA                !== character &&
           CHAR_LEFT_SQUARE_BRACKET  !== character &&
           CHAR_RIGHT_SQUARE_BRACKET !== character &&
           CHAR_LEFT_CURLY_BRACKET   !== character &&
           CHAR_RIGHT_CURLY_BRACKET  !== character) {
      character = input.charCodeAt(++position);
    }

    if (position === _position) {
      throwError('name of an alias node must contain at least one character');
    }

    alias = input.slice(_position, position);

    if (!anchorMap.hasOwnProperty(alias)) {
      throwError('unidentified alias "' + alias + '"');
    }

    result = anchorMap[alias];
    skipSeparationSpace(true, -1);
    return true;
  }

  function composeNode(parentIndent, nodeContext, allowToSeek, allowCompact) {
    var allowBlockStyles,
        allowBlockScalars,
        allowBlockCollections,
        atNewLine  = false,
        isIndented = true,
        hasContent = false,
        type,
        typeIndex,
        typeQuantity,
        flowIndent,
        blockIndent,
        _result;

    tag    = null;
    anchor = null;
    result = null;

    allowBlockStyles = allowBlockScalars = allowBlockCollections =
      CONTEXT_BLOCK_OUT === nodeContext ||
      CONTEXT_BLOCK_IN  === nodeContext;

    if (allowToSeek) {
      if (skipSeparationSpace(true, -1)) {
        atNewLine = true;

        if (lineIndent === parentIndent) {
          isIndented = false;

        } else if (lineIndent > parentIndent) {
          isIndented = true;
          
        } else {
          return false;
        }
      }
    }

    if (isIndented) {
      while (readTagProperty() || readAnchorProperty()) {
        if (skipSeparationSpace(true, -1)) {
          atNewLine = true;

          if (lineIndent > parentIndent) {
            isIndented = true;
            allowBlockCollections = allowBlockStyles;

          } else if (lineIndent === parentIndent) {
            isIndented = false;
            allowBlockCollections = allowBlockStyles;

          } else {
            return true;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }

    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }

    if (isIndented || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }

      blockIndent = position - lineStart;

      if (isIndented) {
        if (allowBlockCollections &&
            (readBlockSequence(blockIndent) ||
             readBlockMapping(blockIndent)) ||
            readFlowCollection(flowIndent)) {
          hasContent = true;
        } else {
          if ((allowBlockScalars && readBlockScalar(flowIndent)) ||
              readSingleQuotedScalar(flowIndent) ||
              readDoubleQuotedScalar(flowIndent)) {
            hasContent = true;

          } else if (readAlias()) {
            hasContent = true;

            if (null !== tag || null !== anchor) {
              throwError('alias node should not have any properties');
            }
            
          } else if (readPlainScalar(flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
          
            if (null === tag) {
              tag = '?';
            }
          }

          if (null !== anchor) {
            anchorMap[anchor] = result;
          }
        }
      } else {
        hasContent = allowBlockCollections && readBlockSequence(blockIndent);
      }
    }

    if (null !== tag && '!' !== tag) {
      if ('?' === tag) {
        for (typeIndex = 0, typeQuantity = implicitTypes.length;
             typeIndex < typeQuantity;
             typeIndex += 1) {
          type = implicitTypes[typeIndex];
          _result = type.resolver(result, false);

          if (NIL !== _result) {
            tag = type.tag;
            result = _result;
            break;
          }
        }
      } else if (_hasOwnProperty.call(explicitTypes, tag)) {
        type = explicitTypes[tag];
        _result = type.resolver(result, true);

        if (NIL !== _result) {
          tag = type.tag;
          result = _result;
        } else {
          throwError('cannot resolve a node with !<' + tag + '> explicit tag');
        }
      } else {
        throwWarning('unknown tag !<' + tag + '>');
      }
    }

    return null !== tag || null !== anchor || hasContent;
  }

  function readDocument() {
    var documentStart = position,
        _position,
        directiveName,
        directiveArgs,
        hasDirectives = false;

    version = null;
    checkLineBreaks = legacy;
    tagMap = {};
    anchorMap = {};

    while (CHAR_BYTE_ORDER_MARK === character) {
      character = input.charCodeAt(++position);
      skipSeparationSpace(true, -1);
    }

    while (position < length) {
      skipSeparationSpace(true, -1);

      if (lineIndent > 0 || CHAR_PERCENT !== character) {
        break;
      }

      hasDirectives = true;
      character = input.charCodeAt(++position);
      _position = position;

      while (position < length &&
             CHAR_SPACE           !== character &&
             CHAR_TAB             !== character &&
             CHAR_LINE_FEED       !== character &&
             CHAR_CARRIAGE_RETURN !== character) {
        character = input.charCodeAt(++position);
      }

      directiveName = input.slice(_position, position);
      directiveArgs = [];

      if (directiveName.length < 1) {
        throwError('directive name must not be less than one character in length');
      }

      while (position < length) {
        while (CHAR_SPACE === character || CHAR_TAB === character) {
          character = input.charCodeAt(++position);
        }

        if (CHAR_SHARP === character) {
          do { character = input.charCodeAt(++position); }
          while (position < length &&
                 CHAR_LINE_FEED !== character &&
                 CHAR_CARRIAGE_RETURN !== character);
          break;
        }

        if (CHAR_LINE_FEED === character || CHAR_CARRIAGE_RETURN === character) {
          break;
        }

        _position = position;

        while (position < length &&
               CHAR_SPACE           !== character &&
               CHAR_TAB             !== character &&
               CHAR_LINE_FEED       !== character &&
               CHAR_CARRIAGE_RETURN !== character) {
          character = input.charCodeAt(++position);
        }

        directiveArgs.push(input.slice(_position, position));
      }

      if (position < length) {
        readLineBreak();
      }

      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](directiveName, directiveArgs);
      } else {
        throwWarning('unknown document directive "' + directiveName + '"');
      }
    }

    skipSeparationSpace(true, -1);

    if (0 === lineIndent &&
        CHAR_MINUS === character &&
        CHAR_MINUS === input.charCodeAt(position + 1) &&
        CHAR_MINUS === input.charCodeAt(position + 2)) {
      position += 3;
      character = input.charCodeAt(position);
      skipSeparationSpace(true, -1);

    } else if (hasDirectives) {
      throwError('directives end mark is expected');
    }

    composeNode(lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(true, -1);

    if (validate && checkLineBreaks &&
        PATTERN_NON_ASCII_LINE_BREAKS.test(input.slice(documentStart, position))) {
      throwWarning('non-ASCII line breaks are interpreted as content');
    }

    output(result);

    if (position === lineStart && testDocumentSeparator()) {
      if (CHAR_DOT === character) {
        position += 3;
        character = input.charCodeAt(position);
        skipSeparationSpace(true, -1);
      }
      return;
    }

    if (position < length) {
      throwError('end of the stream or a document separator is expected');
    } else {
      return;
    }
  }

  if (validate && PATTERN_NON_PRINTABLE.test(input)) {
    throwError('the stream contains non-printable characters');
  }

  while (CHAR_SPACE === character) {
    lineIndent += 1;
    character = input.charCodeAt(++position);
  }

  while (position < length) {
    readDocument();
  }
}


function load(input, settings) {
  var result = null, received = false;

  function callback(data) {
    if (!received) {
      result = data;
      received = true;
    } else {
      throw new YAMLException('expected a single document in the stream, but found more');
    }
  }

  loadAll(input, callback, settings);

  return result;
}


function safeLoadAll(input, output, settings) {
  loadAll(input, output, common.extend({ schema: SAFE_SCHEMA }, settings));
}


function safeLoad(input, settings) {
  return load(input, common.extend({ schema: SAFE_SCHEMA }, settings));
}


module.exports.loadAll     = loadAll;
module.exports.load        = load;
module.exports.safeLoadAll = safeLoadAll;
module.exports.safeLoad    = safeLoad;

});

require.define("/lib/js-yaml/common.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL = {};


function isNothing(subject) {
  return (undefined === subject) || (null === subject);
}


function isObject(subject) {
  return ('object' === typeof subject) && (null !== subject);
}


function getOption(options, name, alternative) {
  if (!isNothing(options) && !isNothing(options[name])) {
    return options[name];
  } else {
    return alternative;
  }
}


function extend(target, source) {
  var index, length, key, sourceKeys = Object.keys(source);

  for (index = 0, length = sourceKeys.length; index < length; index += 1) {
    key = sourceKeys[index];
    target[key] = source[key];
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


module.exports.NIL          = NIL;
module.exports.isNothing    = isNothing;
module.exports.isObject     = isObject;
module.exports.getOption    = getOption;
module.exports.repeat       = repeat;
module.exports.extend       = extend;

});

require.define("/lib/js-yaml/exception.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


function YAMLException(reason, mark) {
  this.name = 'YAMLException';
  this.message = 'JS-YAML: ';

  if (reason) {
    this.message += reason;
  } else {
    this.message += '(unknown reason)';
  }

  if (mark) {
    this.message += ' ' + mark.toString();
  }
}


YAMLException.prototype.toString = function toString() {
  return this.message;
};


module.exports = YAMLException;

});

require.define("/lib/js-yaml/mark.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var common = require('./common');


function Mark(name, buffer, position, line, column) {
  this.name     = name;
  this.buffer   = buffer;
  this.position = position;
  this.line     = line;
  this.column   = column;
}


Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) {
    return null;
  }

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.position;

  while (start > 0 && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1))) {
    start -= 1;
    if (this.position - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.position;

  while (end < this.buffer.length && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end))) {
    end += 1;
    if (end - this.position > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return common.repeat(' ', indent) + head + snippet + tail + '\n' +
         common.repeat(' ', indent + this.position - start + head.length) + '^';
};


Mark.prototype.toString = function toString() {
  var snippet = this.getSnippet(), where = '';

  if (this.name) {
    where += 'in "' + this.name + '" ';
  }

  where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

  if (snippet) {
    where += ':\n' + snippet;
  }

  return where;
};


module.exports = Mark;

});

require.define("/lib/js-yaml/schema/safe.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./minimal')
  ],
  implicit: [
    require('../type/null'),
    require('../type/bool'),
    require('../type/int'),
    require('../type/float'),
    require('../type/timestamp'),
    require('../type/merge')
  ],
  explicit: [
    require('../type/binary'),
    require('../type/omap'),
    require('../type/pairs'),
    require('../type/set')
  ]
});

});

require.define("/lib/js-yaml/schema.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


function Schema(definition) {
  this.include  = definition.include  || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];
}


Schema.prototype.compileImplicit = function compileImplicit(result) {
  var index, length, type;

  if (!result) {
    result = [];
  }

  for (index = 0, length = this.implicit.length; index < length; index += 1) {
    type = this.implicit[index];
    
    if (-1 === result.indexOf(type)) {
      result.push(type);
    }
  }

  for (index = 0, length = this.include.length; index < length; index += 1) {
    result = this.include[index].compileImplicit(result);
  }

  return result;
};


Schema.prototype.compileExplicit = function compileExplicit(result) {
  var index, length, type;

  if (!result) {
    result = {};
  }

  for (index = 0, length = this.include.length; index < length; index += 1) {
    result = this.include[index].compileExplicit(result);
  }

  for (index = 0, length = this.implicit.length; index < length; index += 1) {
    type = this.implicit[index];
    result[type.tag] = type;
  }

  for (index = 0, length = this.explicit.length; index < length; index += 1) {
    type = this.explicit[index];
    result[type.tag] = type;
  }

  return result;
};


module.exports = Schema;

});

require.define("/lib/js-yaml/schema/minimal.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  explicit: [
    require('../type/str'),
    require('../type/seq'),
    require('../type/map')
  ]
});

});

require.define("/lib/js-yaml/type/str.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


function resolveYamlString(object, explicit) {
  return ('string' === typeof object) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:str', resolveYamlString);

});

require.define("/lib/js-yaml/type.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


module.exports = function Type(tag, resolver) {
  this.tag = tag;
  this.resolver = resolver;
};

});

require.define("/lib/js-yaml/type/seq.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


function resolveYamlSequence(object, explicit) {
  return Array.isArray(object) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:seq', resolveYamlSequence);

});

require.define("/lib/js-yaml/type/map.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _toString = Object.prototype.toString;


function resolveYamlMapping(object, explicit) {
  return ('[object Object]' === _toString.call(object)) ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:map', resolveYamlMapping);

});

require.define("/lib/js-yaml/type/null.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var YAML_NULL_MAP = {
  '~'    : true,
  'null' : true,
  'Null' : true,
  'NULL' : true
};


function resolveYamlNull(object, explicit) {
  return (null === object || YAML_NULL_MAP[object]) ? null : NIL;
}


module.exports = new Type('tag:yaml.org,2002:null', resolveYamlNull);

});

require.define("/lib/js-yaml/type/bool.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var YAML_IMPLICIT_BOOLEAN_MAP = {
  'true'  : true,
  'True'  : true,
  'TRUE'  : true,
  'false' : false,
  'False' : false,
  'FALSE' : false
};

var YAML_EXPLICIT_BOOLEAN_MAP = {
  'true'  : true,
  'True'  : true,
  'TRUE'  : true,
  'false' : false,
  'False' : false,
  'FALSE' : false,
  'y'     : true,
  'Y'     : true,
  'yes'   : true,
  'Yes'   : true,
  'YES'   : true,
  'n'     : false,
  'N'     : false,
  'no'    : false,
  'No'    : false,
  'NO'    : false,
  'on'    : true,
  'On'    : true,
  'ON'    : true,
  'off'   : false,
  'Off'   : false,
  'OFF'   : false
};


function resolveYamlBoolean(object, explicit) {
  if (true === object || false === object) {
    return object;

  } else if (explicit) {
    if (YAML_EXPLICIT_BOOLEAN_MAP.hasOwnProperty(object)) {
      return YAML_EXPLICIT_BOOLEAN_MAP[object];
    } else {
      return NIL;
    }

  } else {
    if (YAML_IMPLICIT_BOOLEAN_MAP.hasOwnProperty(object)) {
      return YAML_IMPLICIT_BOOLEAN_MAP[object];
    } else {
      return NIL;
    }
  }
}


module.exports = new Type('tag:yaml.org,2002:bool', resolveYamlBoolean);

});

require.define("/lib/js-yaml/type/int.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var YAML_INTEGER_PATTERN = new RegExp(
  '^(?:[-+]?0b[0-1_]+' +
  '|[-+]?0[0-7_]+' +
  '|[-+]?(?:0|[1-9][0-9_]*)' +
  '|[-+]?0x[0-9a-fA-F_]+' +
  '|[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$');


function resolveYamlInteger(object, explicit) {
  var value, sign, base, digits;

  if (!YAML_INTEGER_PATTERN.test(object)) {
    return NIL;
  }

  value  = object.replace(/_/g, '');
  sign   = '-' === value[0] ? -1 : 1;
  digits = [];

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
}


module.exports = new Type('tag:yaml.org,2002:int', resolveYamlInteger);

});

require.define("/lib/js-yaml/type/float.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var YAML_FLOAT_PATTERN = new RegExp(
  '^(?:[-+]?(?:[0-9][0-9_]*)\\.[0-9_]*(?:[eE][-+][0-9]+)?' +
  '|\\.[0-9_]+(?:[eE][-+][0-9]+)?' +
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  '|[-+]?\\.(?:inf|Inf|INF)' +
  '|\\.(?:nan|NaN|NAN))$');


function resolveYamlFloat(object, explicit) {
  var value, sign, base, digits;

  if (!YAML_FLOAT_PATTERN.test(object)) {
    return NIL;
  }

  value  = object.replace(/_/g, '').toLowerCase();
  sign   = '-' === value[0] ? -1 : 1;
  digits = [];

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
}


module.exports = new Type('tag:yaml.org,2002:float', resolveYamlFloat);

});

require.define("/lib/js-yaml/type/timestamp.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:(?:[Tt]|[ \\t]+)'              + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?)?$');         // [11] tz_minute


function resolveYamlTimestamp(object, explicit) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, data;

  match = YAML_TIMESTAMP_REGEXP.exec(object);

  if (null === match) {
    return NIL;
  }

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if ('-' === match[9]) {
      delta = -delta;
    }
  }

  data = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) {
    data.setTime(data.getTime() - delta);
  }

  return data;
}


module.exports = new Type('tag:yaml.org,2002:timestamp', resolveYamlTimestamp);

});

require.define("/lib/js-yaml/type/merge.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


function resolveYamlMerge(object, explicit) {
  return '<<' === object ? object : NIL;
}


module.exports = new Type('tag:yaml.org,2002:merge', resolveYamlMerge);

});

require.define("/lib/js-yaml/type/binary.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var common = require('../common');
var NIL    = common.NIL;
var Type   = require('../type');


var BASE64_PADDING = '=';

var BASE64_BINTABLE = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,  0, -1, -1,
  -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
];


// Modified from:
// https://raw.github.com/kanaka/noVNC/d890e8640f20fba3215ba7be8e0ff145aeb8c17c/include/base64.js
function resolveYamlBinary(object, explicit) {
  var value, code, idx = 0, result = [], leftbits, leftdata;

  leftbits = 0; // number of bits decoded, but yet to be appended
  leftdata = 0; // bits decoded, but yet to be appended

  // Convert one by one.
  for (idx = 0; idx < object.length; idx += 1) {
    code = object.charCodeAt(idx);
    value = BASE64_BINTABLE[code & 0x7F];

    // Skip LF(NL) || CR
    if (0x0A !== code && 0x0D !== code) {
      // Fail on illegal characters
      if (-1 === value) {
        return NIL;
      }

      // Collect data into leftdata, update bitcount
      leftdata = (leftdata << 6) | value;
      leftbits += 6;

      // If we have 8 or more bits, append 8 bits to the result
      if (leftbits >= 8) {
        leftbits -= 8;

        // Append if not padding.
        if (BASE64_PADDING !== object.charAt(idx)) {
          result.push((leftdata >> leftbits) & 0xFF);
        }

        leftdata &= (1 << leftbits) - 1;
      }
    }
  }

  // If there are any bits left, the base64 string was corrupted
  if (leftbits) {
    return NIL;
  } else {
    return new Buffer(result);
  }
}


module.exports = new Type('tag:yaml.org,2002:binary', resolveYamlBinary);

});

require.define("/lib/js-yaml/type/omap.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;


function resolveYamlOmap(object, explicit) {
  var objectKeys = [], index, length, pair, pairKey, pairHasKey;

  if (!Array.isArray(object)) {
    return NIL;
  }

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if ('[object Object]' !== _toString.call(pair)) {
      return NIL;
    }

    for (pairKey in pair) {
      if (_hasOwnProperty.call(pair, pairKey)) {
        if (!pairHasKey) {
          pairHasKey = true;
        } else {
          return NIL;
        }
      }
    }

    if (!pairHasKey) {
      return NIL;
    }

    if (-1 === objectKeys.indexOf(pairKey)) {
      objectKeys.push(pairKey);
    } else {
      return NIL;
    }
  }

  return object;
}


module.exports = new Type('tag:yaml.org,2002:omap', resolveYamlOmap);

});

require.define("/lib/js-yaml/type/pairs.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _toString = Object.prototype.toString;


function resolveYamlPairs(object, explicit) {
  var index, length, pair, keys, result;

  if (!Array.isArray(object)) {
    return NIL;
  }

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if ('[object Object]' !== _toString.call(pair)) {
      return NIL;
    }

    keys = Object.keys(pair);

    if (1 !== keys.length) {
      return NIL;
    }

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}


module.exports = new Type('tag:yaml.org,2002:pairs', resolveYamlPairs);

});

require.define("/lib/js-yaml/type/set.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../common').NIL;
var Type = require('../type');


var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;


function resolveYamlSet(object, explicit) {
  var key;

  if ('[object Object]' !== _toString.call(object)) {
    return NIL;
  }

  for (key in object) {
    if (_hasOwnProperty.call(object, key)) {
      if (null !== object[key]) {
        return NIL;
      }
    }
  }

  return object;
}


module.exports = new Type('tag:yaml.org,2002:set', resolveYamlSet);

});

require.define("/lib/js-yaml/schema/default.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


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

});

require.define("/lib/js-yaml/type/js/undefined.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var Type = require('../../type');


function resolveJavascriptUndefined(object, explicit) {
  var undef;

  return undef;
}


module.exports = new Type('tag:yaml.org,2002:js/undefined', resolveJavascriptUndefined);

});

require.define("/lib/js-yaml/type/js/regexp.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../../common').NIL;
var Type = require('../../type');


function resolveJavascriptRegExp(object, explicit) {
  var regexp = object,
      tail   = /\/([gim]*)$/.exec(object),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  try {
    return new RegExp(regexp, modifiers);
  } catch (error) {
    return NIL;
  }
}


module.exports = new Type('tag:yaml.org,2002:js/regexp', resolveJavascriptRegExp);

});

require.define("/lib/js-yaml/type/js/function.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var NIL  = require('../../common').NIL;
var Type = require('../../type');


function resolveJavascriptFunction(object, explicit) {
  /*jslint evil:true*/
  var func;
  
  try {
    func = new Function('return ' + object);
    return func();
  } catch (error) {
    return NIL;
  }
}


module.exports = new Type('tag:yaml.org,2002:js/function', resolveJavascriptFunction);

});

require.define("/lib/js-yaml/require.js",function(require,module,exports,__dirname,__filename,process,global){'use strict';


var fs     = require('fs');
var loader = require('./loader');


var yamlRequireHandler = function (module, filename) {
  var content = fs.readFileSync(filename, 'utf8');

  // fill in documents
  module.exports = loader.load(content, { name: filename });
};

// register require extensions only if we're on node.js
// hack for browserify
if (undefined !== require.extensions) {
  require.extensions['.yml']  = yamlRequireHandler;
  require.extensions['.yaml'] = yamlRequireHandler;
}


module.exports = require;

});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});
return require('./index'); }());
