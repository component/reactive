
var debug = require('debug')('reactive:Binding');
var parse = require('format-parser');
var adapter = require('../adapter');
var utils = require('../utils');
var hasInterpolation = utils.hasInterpolation;

/**
 * Expose Binding.
 */

module.exports = Binding;

/**
 * Expose debug.
 */

Binding.debug = debug

/**
 * The Binding base class. 
 * A binding adds life to `text`
 * 
 * @param {Reactive} view
 * @param {String} text
 * @api private
 */

function Binding(view, text){
  this.text = text;
  this.view = view;
  this.obj = view.obj;
  this.fns = view.fns;
  this.props = this.dependencies(text);
  this.listen(this.props);
}

/**
 * Subscribe to all relavent change events on
 * the views model. When a change is detected
 * `this.onChange` will be invoked
 * 
 * @param {Array} props
 * @api private
 */

Binding.prototype.listen = function(props){
  var self = this;
  var view = this.view;

  function invoke(){
    self.onChange();
  }

  this.props.forEach(function(prop){
    view.sub(prop, invoke);
  });
};

/**
 * figure out which properties are required to
 * correctly compute the bindings output
 * 
 * @param {String} text
 * @return {Array}
 * @api private
 */

Binding.prototype.dependencies

/**
 * compute the strings current value
 * 
 * @return {String}
 * @api private
 */

Binding.prototype.compute

/**
 * Call `prop` on `model` or `view`.
 *
 * @param {Object} model
 * @param {Object} view
 * @param {String} prop
 * @return {Mixed}
 * @api private
 */

Binding.getValue = function(model, view, prop){
  // view method
  if ('function' == typeof view[prop]) {
    return view[prop]();
  }

  // view value
  if (view.hasOwnProperty(prop)) {
    return view[prop];
  }

  // get property from model
  return adapter.get(model, prop);
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

/**
 * public utilities
 */

/**
 * subscribe `fn` to changes
 * 
 * @param {Function} fn
 * @return {this}
 * @api public
 */
 
Binding.prototype.change = function(fn){
  this.onChange = fn;
  this.onChange();
  return this;
}

/**
 * Perform interpolation on `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Binding.prototype.interpolate = function(name){
  var self = this;
  name = clean(name);

  if (hasInterpolation(name)) {
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

Binding.prototype.value = function(name){
  var fns = this.view.fns;
  name = clean(name);

  // view method
  if ('function' == typeof fns[name]) return fns[name]();

  // view value
  if (name in fns) return fns[name];

  return this.view.get(name);
};

/**
 * Return formatted property.
 *
 * @param {String} fmt
 * @return {Mixed}
 * @api public
 */

Binding.prototype.formatted = function(fmt){
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