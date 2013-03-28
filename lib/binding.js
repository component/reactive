
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
  this.deps = [];
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
 * Remove the binding.
 *
 * @api private
 */

Binding.prototype.unbind = function(){
  var deps = this.deps
    , obj = this.obj
    , unsub = this._unsubscribe || Binding.unsubscribe;

  for (var i = 0, n = deps.length; i < n; i++) {
    unsub(obj, deps[i]);
  }
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
  // TODO: how to get reference to this fn to unsubscribe?
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

  // formatting
  var calls = parse(val);
  var prop = calls[0].name.trim();
  var deps = this.deps;

  deps.push(prop);

  // computed props
  if (computed) {
    computed.forEach(function(prop){
      deps.push(prop);
      // TODO: can fn.bind(self) be cached?
      sub(obj, prop, fn.bind(self));
    });
    return;
  }

  // bind to prop
  deps.push(prop);
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
 * Remove computed properties notation from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function clean(str) {
  return str.split('<')[0].trim();
}
