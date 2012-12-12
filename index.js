
/**
 * Module dependencies.
 */

var classes = require('classes')
  , debug = require('debug')('reactive');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Bindings.
 */

exports.bindings = {};

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
  'style',
  'width',
  'value',
  'height',
  'tabindex',
  'placeholder'
];

/**
 * Generate attribute bindings.
 */

attrs.forEach(function(attr){
  exports.bindings[attr] = function(el, val){
    el.setAttribute(attr, val);
  };
});

/**
 * Show binding.
 */

exports.bindings.show = function(el, show){
  if (show) {
    classes(el).add('show').remove('hide');
  } else {
    classes(el).remove('show').add('hide');
  }
};

/**
 * Hide binding.
 */

exports.bindings.hide = function(el, show){
  exports.bindings.show(el, !show);
};

/**
 * Checked binding.
 */

exports.bindings.checked = function(el, val){
  if (val) {
    el.setAttribute('checked', 'checked');
  } else {
    el.removeAttribute('checked');
  }
};

/**
 * Text binding.
 */

exports.bindings.text = function(el, val){
  el.textContent = val;
};

/**
 * Binding selector.
 */

var keys = Object.keys(exports.bindings);
var bindingSelector = keys.map(function(name){
  return '[data-' + name + ']';
}).join(', ');

/**
 * Selector engine.
 */

exports.query = function(el, selector){
  return el.querySelectorAll(selector);
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
  if (!(this instanceof Reactive)) return new Reactive(el, obj, options).render();
  this.el = el;
  this.obj = obj;
  this.els = [];
  this.fns = options || {};
  this.addImplicitBindings();
  this.bindings = exports.query(el, bindingSelector);
  obj.on('change', this.bind.bind(this));
}

/**
 * Add implicit data bindings.
 *
 * @api private
 */

Reactive.prototype.addImplicitBindings = function(){
  var els = exports.query(this.el, '[class], [name]');
  for (var i = 0; i < els.length; ++i) {
    var el = els[i];
    this.addImplicitBinding(el);
  }
};

/**
 * Add implicit bindings to `el` based
 * on the classname or name.
 *
 * @param {Element} el
 * @api private
 */

Reactive.prototype.addImplicitBinding = function(el){
  var name = el.getAttribute('name') || el.className;
  
  // skip multiple classnames
  if (/ /.test(name)) return;
  
  switch (el.nodeName) {
    case 'INPUT':
      switch (el.getAttribute('type')) {
        case 'checkbox':
          debug('add implicit data-checked to %s', name);
          el.setAttribute('data-checked', name);
          break;
        case 'text':
          debug('add implicit data-value to %s', name);
          el.setAttribute('data-value', name);
          break;
      }
      break;
    default:
      debug('add implicit data-text to %s', name);
      el.setAttribute('data-text', name);
  }
};

/**
 * Handle [data-*] bindings.
 *
 * TODO: build a cache on the first hit
 *
 * @param {String} key
 * @param {Mixed} val
 * @api private
 */

Reactive.prototype.bind = function(key, val){
  var fns = this.fns;
  var obj = this.obj;
  var els = this.bindings;
  
  for (var i = 0; i < els.length; ++i) {
    var el = els[i];
    for (var j = 0; j < el.attributes.length; ++j) {
      var attr = el.attributes[j];
      
      // data-* attr
      var m = /^data-(.*)/.exec(attr.name);
      if (!m) continue;
      
      // values
      var parts = attr.value.split(/ *\| */);
      var prop = parts[0];
      var fmt = parts[1];
      var name = m[1];

      // binding
      var binding = exports.bindings[name];

      // method defined for data-show etc
      // TODO: optimize with prop references,
      // otherwise this is called too often
      if ('function' == typeof fns[prop]) {
        var ret = fns[prop]();
        debug('bind %s() => %s', prop, ret);
        binding(el, ret);
        continue;
      }
      
      // wrong binding
      if (prop != key) continue;

      // formatter
      debug('bind %s => %s', prop, val);
      if (fmt) {
        val = this.format(fmt, val);
        debug('format %s as %s => %s', prop, fmt, val);
      }
      
      // object value
      binding(el, val);
    }
  }
};

/**
 * Parse and apply `fmt` with `val`.
 *
 * @param {String} fmt
 * @param {Mixed} val
 * @api private
 */

Reactive.prototype.format = function(fmt, val){
  var parts = fmt.split(':');
  var name = parts.shift();
  var args = parts.join(':');
  args = args.split(/ *, */);
  args.unshift(val);
  var fn = this.fns[name];
  return fn.apply(this.fns, args);
};

/**
 * Re-render.
 *
 * @api private
 */

Reactive.prototype.render = function(){
  var obj = this.obj;
  for (var key in obj) this.bind(key, obj[key]);
  return this;
};
