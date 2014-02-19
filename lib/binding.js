var hasInterpolation = require('./utils').hasInterpolation;
var interpolationProps = require('./utils').interpolationProps;
var clean = require('./utils').clean;

/**
 * Expose `Binding`.
 */

module.exports = Binding;

/**
 * Initialize a binding.
 *
 * @api private
 */

function Binding(name, reactive, el, fn) {
  this.name = name;
  this.reactive = reactive;
  this.model = reactive.model;
  this.view = reactive.view;
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
  this.fn(this.el, val, this.model);
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

  return self.value(name);
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
  var view = this.view;
  name = clean(name);

  // view method
  if ('function' == typeof view[name]) {
    return view[name]();
  }

  // view value
  if (view.hasOwnProperty(name)) {
    return view[name];
  }

  return this.reactive.get(name);
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
  var reactive = this.reactive;
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
      reactive.sub(prop, fn.bind(self));
    });
    return;
  }

  // computed props
  if (computed) {
    computed.forEach(function(prop){
      reactive.sub(prop, fn.bind(self));
    });
    return;
  }

  // bind to prop
  var prop = val;
  reactive.sub(prop, fn.bind(this));
};
