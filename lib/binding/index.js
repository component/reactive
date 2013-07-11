
var parse = require('format-parser');
var utils = require('../utils');
var interpolationProps = utils.interpolationProps;
var hasInterpolation = utils.hasInterpolation;
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
  this.listen(text);
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

/**
 * Subscribe to all relavent change events on
 * the views model. When a change is detected
 * `this.onChange` will be invoked
 * 
 * @param {String} [text]
 */

Binding.prototype.listen = function(text){
  var self = this;
  var view = this.view;
  text = text || this.text;

  function invoke(){
    self.onChange();
  }

  this.dependencies(text).forEach(function(prop){
    view.sub(prop, invoke);
  })
};

/**
 * figure out which properties are required to
 * correctly compute the bindings output
 * 
 * @param {String} text
 * @return {Array}
 */

Binding.prototype.dependencies = function(text){
  if (hasInterpolation(text)) return interpolationProps(text)

  // computed property
  var i = text.indexOf('<') + 1
  if (i) return text.slice(i).trim().split(/\s+/)

  // formatted property
  return [parse(text)[0].name]
}

/**
 * subscribe `fn` to changes
 * 
 * @param {Function} fn
 * @return {this}
 */
 
Binding.prototype.change = function(fn){
  this.onChange = fn;
  this.onChange();
  this.listen(this.text);
  return this;
}