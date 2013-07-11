
var parse = require('format-parser');
var utils = require('../utils');
var interpolationProps = utils.interpolationProps;
var hasInterpolation = utils.hasInterpolation;
var interpolate = utils.interpolate;
var clean = utils.clean;

module.exports = Binding;

/**
 * The Binding base class. 
 * A binding adds life to `text`
 * 
 * @param {Reactive} view
 * @param {String} text
 */

function Binding(view, text){
  this.text = text;
  this.view = view;
  this.obj = view.obj;
  this.fns = view.fns;
  this.type = type(text);
  this.props = this.dependencies(text);
  this.listen(this.props);
}

/**
 * determine the type of string we are animating
 * 
 * @param {String} text
 * @return {String}
 */

function type(text){
  if (hasInterpolation(text)) return 'interpolated'
  if (text.indexOf('<') > 0) return 'computed'
  return 'formated'
}

/**
 * Subscribe to all relavent change events on
 * the views model. When a change is detected
 * `this.onChange` will be invoked
 * 
 * @param {Array} props
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
 */

Binding.prototype.dependencies = function(text){
  switch (this.type) {
    case 'interpolated':
      return interpolationProps(text);
    case 'computed':
      return text
        .slice(text.indexOf('<') + 1)
        .trim()
        .split(/\s+/);
    case 'formated':
      return [parse(text)[0].name]
    default:
      throw new Error('unknown bind type')
  }
}

/**
 * compute the strings current value
 * 
 * @return {String}
 */

Binding.prototype.compute = function(){
  var view = this.view;
  return interpolate(this.text, function(prop, fn){
    return fn
      ? fn(view.obj, view.fns, utils.call)
      : view.get(view.obj, prop);
  });
};

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