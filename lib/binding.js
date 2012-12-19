
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
  var obj = this.obj;
  var view = this.view.fns;

  // view method
  if ('function' == typeof view[name]) {
    return view[name]();
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
  var calls = parse(fmt);
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
  var prop = this.el.getAttribute(this.name);
  var sub = this._subscribe || Binding.subscribe;
  sub(this.obj, prop, fn.bind(this));
};

/**
 * Default subscription method.
 */

Binding.subscribe = function(obj, prop, fn) {
  if (!obj.on) return;
  obj.on('change '+ prop, fn);
};

/**
 * Default unsubscription method.
 */

Binding.unsubscribe = function(obj, prop, fn) {
  if (!obj.off) return;
  obj.off('change '+ prop, fn);
};
