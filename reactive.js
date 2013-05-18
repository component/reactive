
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-format-parser/index.js", function(exports, require, module){

/**
 * Parse the given format `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api public
 */

module.exports = function(str){
  return str.split(/ *\| */).map(function(call){
    var parts = call.split(':');
    var name = parts.shift();
    var args = parseArgs(parts.join(':'));

    return {
      name: name,
      args: args
    };
  });
};

/**
 * Parse args `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function parseArgs(str) {
  var args = [];
  var re = /"([^"]*)"|'([^']*)'|([^ \t,]+)/g;
  var m;
  
  while (m = re.exec(str)) {
    args.push(m[2] || m[1] || m[0]);
  }
  
  return args;
}

});
require.register("visionmedia-debug/index.js", function(exports, require, module){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(exports, require, module){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

if (window.localStorage) debug.enable(localStorage.debug);

});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-classes/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var arr = this.el.className.split(re);
  if ('' === arr[0]) arr.pop();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("component-query/index.js", function(exports, require, module){

function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
};

});
require.register("component-reactive/lib/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var debug = require('debug')('reactive');
var bindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var query = require('query');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Bindings.
 */

exports.bindings = {};

/**
 * Default subscription method.
 */

function subscribe(obj, prop, fn) {
  if (!obj.on) return;
  obj.on('change ' + prop, fn);
};

/**
 * Default unsubscription method.
 */

function unsubscribe(obj, prop, fn) {
  if (!obj.off) return;
  obj.off('change ' + prop, fn);
};

/**
 * Define subscription function.
 *
 * @param {Function} fn
 * @api public
 */

exports.subscribe = function(fn){
  subscribe = fn;
  Binding.subscribe = fn;
};

/**
 * Define unsubscribe function.
 *
 * @param {Function} fn
 * @api public
 */

exports.unsubscribe = function(fn){
  unsubscribe = fn;
  Binding.unsubscribe = fn;
};

/**
 * Define binding `name` with callback `fn(el, val)`.
 *
 * @param {String} name or object
 * @param {String|Object} name
 * @param {Function} fn
 * @api public
 */

exports.bind = function(name, fn){
  if ('object' == typeof name) {
    for (var key in name) {
      exports.bind(key, name[key]);
    }
    return;
  }

  exports.bindings[name] = fn;
};

/**
 * Initialize a reactive template for `el` and `obj`.
 *
 * @param {Element} el
 * @param {Element} obj
 * @param {Object} options
 * @api public
 */

function Reactive(el, obj, options) {
  if (!(this instanceof Reactive)) return new Reactive(el, obj, options);
  this.el = el;
  this.obj = obj;
  this.els = [];
  this.fns = options || {};
  this.bindAll();
  this.bindInterpolation(this.el, []);
}

/**
 * Subscribe to changes on `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @api private
 */

Reactive.prototype.sub = function(prop, fn){
  subscribe(this.obj, prop, fn);
};

/**
 * Unsubscribe to changes from `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @api public
 */

Reactive.prototype.unsub = function(prop, fn){
  unsubscribe(this.obj, prop, fn);
};

/**
 * Traverse and bind all interpolation within attributes and text.
 *
 * @param {Element} el
 * @api private
 */

Reactive.prototype.bindInterpolation = function(el, els){

  // element
  if (Node.ELEMENT_NODE == el.nodeType) {
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (utils.hasInterpolation(attr.value)) {
        new AttrBinding(this, el, attr);
      }
    }
  }

  // text node
  if (Node.TEXT_NODE == el.nodeType) {
    if (utils.hasInterpolation(el.data)) {
      debug('bind text "%s"', el.data);
      new TextBinding(this, el);
    }
  }

  // walk nodes
  for (var i = 0; i < el.childNodes.length; i++) {
    var node = el.childNodes[i];
    this.bindInterpolation(node, els);
  }
};

/**
 * Apply all bindings.
 *
 * @api private
 */

Reactive.prototype.bindAll = function() {
  for (var name in exports.bindings) {
    this.bind(name, exports.bindings[name]);
  }
};

/**
 * Bind `name` to `fn`.
 *
 * @param {String|Object} name or object
 * @param {Function} fn
 * @api public
 */

Reactive.prototype.bind = function(name, fn) {
  if ('object' == typeof name) {
    for (var key in name) {
      this.bind(key, name[key]);
    }
    return;
  }

  var obj = this.obj;
  var els = query.all('[' + name + ']', this.el);
  if (!els.length) return;

  debug('bind [%s] (%d elements)', name, els.length);
  for (var i = 0; i < els.length; i++) {
    var binding = new Binding(name, this, els[i], fn);
    binding.bind();
  }
};

// bundled bindings

bindings(exports.bind);

});
require.register("component-reactive/lib/utils.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:utils');

/**
 * Function cache.
 */

var cache = {};

/**
 * Return interpolation property names in `str`,
 * for example "{foo} and {bar}" would return
 * ['foo', 'bar'].
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.interpolationProps = function(str) {
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;

  while (m = re.exec(str)) {
    var expr = m[1];
    if (isSimple(expr)) {
      arr.push(expr);
    } else {
      arr = arr.concat(exprProps(expr));
    }
  }

  return unique(arr);
};

/**
 * Interpolate `str` with the given `fn`.
 *
 * TODO: cache compiled function
 *
 * @param {String} str
 * @param {Function} fn
 * @return {String}
 * @api private
 */

exports.interpolate = function(str, fn){
  return str.replace(/\{([^}]+)\}/g, function(_, expr){
    var callback;

    if (!isSimple(expr)) {
      callback = cache[expr] || (cache[expr] = compile(expr));
    }

    return fn(expr.trim(), callback);
  });
};

/**
 * Check if `str` has interpolation.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */

exports.hasInterpolation = function(str) {
  return ~str.indexOf('{');
};

/**
 * Remove computed properties notation from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.clean = function(str) {
  return str.split('<')[0].trim();
};

/**
 * Compile `expr` to a `Function`.
 *
 * @param {String} expr
 * @return {Function}
 * @api private
 */

function compile(expr) {
  expr = expr.replace(/^ *(\w+)/g, 'model.$1');
  expr = expr.replace(/@/g, 'model.');
  expr = 'return ' + expr;
  debug('compile `%s`', expr);
  return new Function('model', expr);
}

/**
 * Return property references from `expr`.
 *
 * @param {String} expr
 * @return {Array}
 * @api private
 */

function exprProps(expr) {
  var m = expr.match(/@(\w+)/g);

  // "foo.length" etc
  if (!m) {
    m = expr.match(/^ *(\w+)/);
    return [m[1]];
  }

  // "@foo.length + @bar.length" etc
  return m.map(function(s){
    return s.slice(1);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Check if `expr` is "simple" and
 * may be optimized to reduce compiled functions.
 *
 * @param {String} expr
 * @return {Boolean}
 * @api private
 */

function isSimple(expr) {
  return expr.match(/^ *\w+ *$/);
}

});
require.register("component-reactive/lib/text-binding.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:text-binding');
var utils = require('./utils');

/**
 * Expose `TextBinding`.
 */

module.exports = TextBinding;

/**
 * Initialize a new text binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function TextBinding(view, node) {
  var self = this;
  this.view = view;
  this.text = node.data;
  this.node = node;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

TextBinding.prototype.subscribe = function(){
  var self = this;
  var view = this.view;
  this.props.forEach(function(prop){
    view.sub(prop, function(){
      self.render();
    });
  });
};

/**
 * Render text.
 */

TextBinding.prototype.render = function(){
  var node = this.node;
  var text = this.text;
  var obj = this.view.obj;
  debug('render "%s"', text);
  node.data = utils.interpolate(text, function(prop, fn){
    return fn
      ? fn(obj)
      : obj[prop];
  });
};

});
require.register("component-reactive/lib/attr-binding.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:attr-binding');
var utils = require('./utils');

/**
 * Expose `AttrBinding`.
 */

module.exports = AttrBinding;

/**
 * Initialize a new attribute binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function AttrBinding(view, node, attr) {
  var self = this;
  this.view = view;
  this.node = node;
  this.attr = attr;
  this.text = attr.value;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

AttrBinding.prototype.subscribe = function(){
  var self = this;
  var view = this.view;
  this.props.forEach(function(prop){
    view.sub(prop, function(){
      self.render();
    });
  });
};

/**
 * Render the value.
 */

AttrBinding.prototype.render = function(){
  var attr = this.attr;
  var text = this.text;
  var obj = this.view.obj;
  debug('render %s "%s"', attr.name, text);
  attr.value = utils.interpolate(text, function(prop, fn){
    return fn
      ? fn(obj)
      : obj[prop];
  });
};

});
require.register("component-reactive/lib/binding.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var parse = require('format-parser');

/**
 * Expose `Binding`.
 */

module.exports = Binding;

/**
 * Initialize a binding.
 *
 * @api private
 */

function Binding(name, view, el, fn) {
  this.name = name;
  this.view = view;
  this.obj = view.obj;
  this.fns = view.fns;
  this.el = el;
  this.fn = fn;
}

/**
 * Apply the binding.
 *
 * @api private
 */

Binding.prototype.bind = function() {
  var val = this.el.getAttribute(this.name);
  this.fn(this.el, val, this.obj);
};

/**
 * Perform interpolation on `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Binding.prototype.interpolate = function(name) {
  var self = this;
  name = clean(name);

  if (~name.indexOf('{')) {
    return name.replace(/{([^}]+)}/g, function(_, name){
      return self.value(name);
    });
  }

  return this.formatted(name);
};

/**
 * Return value for property `name`.
 *
 *  - check if the "view" has a `name` method
 *  - check if the "model" has a `name` method
 *  - check if the "model" has a `name` property
 *
 * @param {String} name
 * @return {Mixed}
 * @api public
 */

Binding.prototype.value = function(name) {
  var self = this;
  var obj = this.obj;
  var view = this.view.fns;
  name = clean(name);

  // view method
  if ('function' == typeof view[name]) {
    return view[name]();
  }

  // view value
  if (view.hasOwnProperty(name)) {
    return view[name];
  }

  // getter-style method
  if ('function' == typeof obj[name]) {
    return obj[name]();
  }

  // value
  return obj[name];
};

/**
 * Return formatted property.
 *
 * @param {String} fmt
 * @return {Mixed}
 * @api public
 */

Binding.prototype.formatted = function(fmt) {
  var calls = parse(clean(fmt));
  var name = calls[0].name;
  var val = this.value(name);

  for (var i = 1; i < calls.length; ++i) {
    var call = calls[i];
    call.args.unshift(val);
    var fn = this.fns[call.name];
    val = fn.apply(this.fns, call.args);
  }

  return val;
};

/**
 * Define subscription `fn`.
 *
 * @param {Function} fn
 * @api public
 */

Binding.prototype.subscribe = function(fn){
  this._subscribe = fn;
};

/**
 * Define unsubscribe `fn`.
 *
 * @param {Function} fn
 * @api public
 */

Binding.prototype.unsubscribe = function(fn){
  this._unsubscribe = fn;
};

/**
 * Invoke `fn` on changes.
 *
 * @param {Function} fn
 * @api public
 */

Binding.prototype.change = function(fn) {
  fn.call(this);

  var self = this;
  var obj = this.obj;
  var sub = this._subscribe || Binding.subscribe;
  var val = this.el.getAttribute(this.name);

  // computed props
  var parts = val.split('<');
  val = parts[0];
  var computed = parts[1];
  if (computed) computed = computed.trim().split(/\s+/);

  // interpolation
  if (hasInterpolation(val)) {
    var props = interpolationProps(val);
    props.forEach(function(prop){
      sub(obj, prop, fn.bind(self));
    });
    return;
  }

  // formatting
  var calls = parse(val);
  var prop = calls[0].name;

  // computed props
  if (computed) {
    computed.forEach(function(prop){
      sub(obj, prop, fn.bind(self));
    });
    return;
  }

  // bind to prop
  sub(obj, prop, fn.bind(this));
};

/**
 * Default subscription method.
 */

Binding.subscribe = function(obj, prop, fn) {
  if (!obj.on) return;
  obj.on('change ' + prop, fn);
};

/**
 * Default unsubscription method.
 */

Binding.unsubscribe = function(obj, prop, fn) {
  if (!obj.off) return;
  obj.off('change ' + prop, fn);
};

/**
 * Return interpolation property names in `str`,
 * for example "{foo} and {bar}" would return
 * ['foo', 'bar'].
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function interpolationProps(str) {
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;
  while (m = re.exec(str)) {
    arr.push(m[1]);
  }
  return arr;
}

/**
 * Check if `str` has interpolation.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */

function hasInterpolation(str) {
  return ~str.indexOf('{');
}

/**
 * Remove computed properties notation from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function clean(str) {
  return str.split('<')[0].trim();
}

});
require.register("component-reactive/lib/bindings.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var event = require('event')
  , classes = require('classes');

/**
 * Attributes supported.
 */

var attrs = [
  'id',
  'src',
  'rel',
  'cols',
  'rows',
  'name',
  'href',
  'title',
  'class',
  'style',
  'width',
  'value',
  'height',
  'tabindex',
  'placeholder'
];

/**
 * Events supported.
 */

var events = [
  'change',
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'blur',
  'focus',
  'input',
  'keydown',
  'keypress',
  'keyup'
];

/**
 * Apply bindings.
 */

module.exports = function(bind){

  /**
   * Generate attribute bindings.
   */

  attrs.forEach(function(attr){
    bind('data-' + attr, function(el, name, obj){
      this.change(function(){
        el.setAttribute(attr, this.interpolate(name));
      });
    });
  });

/**
 * Append child element.
 */

  bind('data-append', function(el, name){
    var other = this.value(name);
    el.appendChild(other);
  });

/**
 * Replace element.
 */

  bind('data-replace', function(el, name){
    var other = this.value(name);
    el.parentNode.replaceChild(other, el);
  });

  /**
   * Show binding.
   */

  bind('data-show', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        classes(el).add('show').remove('hide');
      } else {
        classes(el).remove('show').add('hide');
      }
    });
  });

  /**
   * Hide binding.
   */

  bind('data-hide', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        classes(el).remove('show').add('hide');
      } else {
        classes(el).add('show').remove('hide');
      }
    });
  });

  /**
   * Checked binding.
   */

  bind('data-checked', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        el.setAttribute('checked', 'checked');
      } else {
        el.removeAttribute('checked');
      }
    });
  });

  /**
   * Text binding.
   */

  bind('data-text', function(el, name){
    this.change(function(){
      el.textContent = this.interpolate(name);
    });
  });

  /**
   * HTML binding.
   */

  bind('data-html', function(el, name){
    this.change(function(){
      el.innerHTML = this.formatted(name);
    });
  });

  /**
   * Generate event bindings.
   */

  events.forEach(function(name){
    bind('on-' + name, function(el, method){
      var fns = this.view.fns
      event.bind(el, name, function(e){
        var fn = fns[method];
        if (!fn) throw new Error('method .' + method + '() missing');
        fns[method](e);
      });
    });
  });
};

});
require.alias("component-reactive/lib/index.js", "reactive-site/deps/reactive/lib/index.js");
require.alias("component-reactive/lib/utils.js", "reactive-site/deps/reactive/lib/utils.js");
require.alias("component-reactive/lib/text-binding.js", "reactive-site/deps/reactive/lib/text-binding.js");
require.alias("component-reactive/lib/attr-binding.js", "reactive-site/deps/reactive/lib/attr-binding.js");
require.alias("component-reactive/lib/binding.js", "reactive-site/deps/reactive/lib/binding.js");
require.alias("component-reactive/lib/bindings.js", "reactive-site/deps/reactive/lib/bindings.js");
require.alias("component-reactive/lib/index.js", "reactive-site/deps/reactive/index.js");
require.alias("component-reactive/lib/index.js", "reactive/index.js");
require.alias("component-format-parser/index.js", "component-reactive/deps/format-parser/index.js");

require.alias("visionmedia-debug/index.js", "component-reactive/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "component-reactive/deps/debug/debug.js");

require.alias("component-event/index.js", "component-reactive/deps/event/index.js");

require.alias("component-classes/index.js", "component-reactive/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-query/index.js", "component-reactive/deps/query/index.js");

require.alias("component-reactive/lib/index.js", "component-reactive/index.js");

