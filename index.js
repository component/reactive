
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
 * @api public
 */

function Reactive(el, obj) {
  if (!(this instanceof Reactive)) return new Reactive(el, obj).render();
  this.el = el;
  this.obj = obj;
  this.els = [];
  this.els = el.querySelectorAll('[class], [name]');
  obj.on('change', this.onchange.bind(this));
}

/**
 * Handle change.
 *
 * @param {String} name
 * @param {String} val
 * @api private
 */

Reactive.prototype.onchange = function(name, val) {
  this.set(name, val);
};

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

Reactive.prototype.set = function(name, val){
  var obj = this.obj;
  var els = this.elementsFor(name);

  if ('function' == typeof obj[name]) {
    for (var i = 0, len = els.length; i < len; ++i) {
      els[i].textContent = obj[name]();
    }
  } else {
    for (var i = 0, len = els.length; i < len; ++i) {
      els[i].textContent = val;
    }
  }
};

/**
 * Re-render.
 *
 * @api private
 */

Reactive.prototype.render = function(){
  var el = this.el;
  var obj = this.obj;
  for (var key in obj) this.set(key, obj[key]);
  return this;
};
