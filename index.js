
/**
 * Module dependencies.
 */

var classes = require('classes');

/**
 * Expose `Reactive`.
 */

module.exports = Reactive;

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
  this.els = el.querySelectorAll('[class], [name]');
  this.conditionals = el.querySelectorAll('[data-show]');
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
  
  this.checkConditionals();
};

/**
 * Check [data-show] elements.
 *
 * @api private
 */

Reactive.prototype.checkConditionals = function(){
  var els = this.conditionals;
  for (var i = 0; i < els.length; ++i) {
    var el = els[i];
    var cond = el.getAttribute('data-show');
    this.checkConditional(el, cond);
  }
};

/**
 * Check conditional.
 *
 * @param {Element} el
 * @param {String} cond
 * @api private
 */

Reactive.prototype.checkConditional = function(el, cond){
  var obj = this.obj;
  var fns = this.fns;
  
  // options
  if ('function' == typeof fns[cond]) {
    this.show(el, fns[cond]());
  }
};

/**
 * Toggle display of `el` based on `show`.
 *
 * @param {Element} el
 * @param {Boolean} show
 * @api private
 */

Reactive.prototype.show = function(el, show){
  if (show) {
    classes(el).add('show').remove('hide');
  } else {
    classes(el).remove('show').add('hide');
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