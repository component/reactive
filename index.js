
/**
 * Module dependencies.
 */

var classes = require('classes');

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
  this.els = exports.query(el, '[class], [name]');
  this.bindings = exports.query(el, bindingSelector);
  obj.on('change', this.onchange.bind(this));
}

/**
 * Return elements for property `name`.
 *
 * TODO: could easily cache this
 *
 * @param {String} name
 * @return {Array}
 * @api private
 */

Reactive.prototype.elementsFor = function(name){
  var ret = [];

  for (var i = 0, len = this.els.length; i < len; ++i) {
    // name
    if (name == this.els[i].getAttribute('name')) {
      ret.push(this.els[i]);
      continue;
    }

    // class
    if (classes(this.els[i]).has(name)) {
      ret.push(this.els[i]);
      continue;
    }
  }

  return ret;
};

/**
 * Set `name` to `val`.
 *
 * @param {String} name
 * @param {String} val
 * @api private
 */

Reactive.prototype.onchange = function(name, val){
  var obj = this.obj;
  var els = this.elementsFor(name);
  var set = this.fns[name] || this.set.bind(this);

  if ('function' == typeof obj[name]) {
    for (var i = 0, len = els.length; i < len; ++i) {
      set(els[i], obj[name](), obj);
    }
  } else {
    for (var i = 0, len = els.length; i < len; ++i) {
      set(els[i], val, obj);
    }
  }
};

/**
 * Change `el`'s value to `val`.
 *
 * @param {Element} el
 * @param {Mixed} val
 * @api private
 */

Reactive.prototype.set = function(el, val){
  switch (el.nodeName.toLowerCase()) {
    case 'input':
      switch (el.getAttribute('type')) {
        case 'checkbox':
          checkbox(el, val);
          break;
        default:
          el.value = val;
          break;
      }
      break;
    default:
      el.textContent = val;
  }
  
  this.bind();
};

/**
 * Handle [data-*] bindings.
 *
 * @api private
 */

Reactive.prototype.bind = function(){
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
      var val = attr.value;
      var name = m[1];
      var binding = exports.bindings[name];
      
      // view function
      if ('function' == typeof fns[val]) {
        binding(el, fns[val]());
        continue;
      }
      
      // object value
      binding(el, obj[val]);
    }
  }
};

/**
 * Re-render.
 *
 * @api private
 */

Reactive.prototype.render = function(){
  var self = this;
  var el = this.el;
  var obj = this.obj;
  for (var key in obj) this.onchange(key, obj[key]);
  return this;
};

/**
 * Default checkbox handler.
 */

function checkbox(el, val) {
  if (val) {
    el.setAttribute('checked', 'checked');
  } else {
    el.removeAttribute('checked');
  }
}