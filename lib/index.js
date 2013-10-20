/**
 * Module dependencies.
 */

var adapter = require('./adapter');
var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var debug = require('debug')('reactive');
var defaultBindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var query = require('query');
var clone = require('clone');

/**
 * Create `Reactive` function.
 */

module.exports = function(){

  /**
   * Template bindings
   * @type {Object}
   */

  var bindings = {};

  /**
   * Initialize a reactive template for `el` and `obj`.
   *
   * @param {Element} el
   * @param {Element} obj
   * @param {Object} options
   * @api public
   */

  function Reactive(el, model, view) {
    if (!(this instanceof Reactive)) return new Reactive(el, model, view);
    this.adapter = Reactive.adapter;
    this.el = el;
    this.model = model;
    this.els = [];
    this.view = view || {};
    this.bindAll();
    this.interpolate(this.el, []);
  }

  /**
   * Expose adapter
   */

  Reactive.adapter = clone(adapter);

  /**
   * Define subscription function.
   *
   * @param {Function} fn
   * @api public
   */

  Reactive.subscribe = function(fn){
    this.adapter.subscribe = fn;
  };

  /**
   * Define unsubscribe function.
   *
   * @param {Function} fn
   * @api public
   */

  Reactive.unsubscribe = function(fn){
    this.adapter.unsubscribe = fn;
  };

  /**
   * Define a get function.
   *
   * @param {Function} fn
   * @api public
   */

  Reactive.get = function(fn) {
    this.adapter.get = fn;
  };

  /**
   * Define a set function.
   *
   * @param {Function} fn
   * @api public
   */

  Reactive.set = function(fn) {
    this.adapter.set = fn;
  };

  /**
   * Define binding `name` with callback `fn(el, val)`.
   *
   * @param {String} name or object
   * @param {String|Object} name
   * @param {Function} fn
   * @api public
   */

  Reactive.bind = function(name, fn){
    if ('object' == typeof name) {
      for (var key in name) {
        Reactive.bind(key, name[key]);
      }
      return;
    }
    bindings[name] = fn;
  };

  /**
   * Middleware
   * @param {Function} fn
   * @api public
   */

  Reactive.use = function(fn) {
    fn(this);
    return this;
  };

  /**
   * Subscribe to changes on `prop`.
   *
   * @param {String} prop
   * @param {Function} fn
   * @return {Reactive}
   * @api private
   */

  Reactive.prototype.sub = function(prop, fn){
    this.adapter.subscribe(this.model, prop, fn);
    return this;
  };

  /**
   * Unsubscribe to changes from `prop`.
   *
   * @param {String} prop
   * @param {Function} fn
   * @return {Reactive}
   * @api private
   */

  Reactive.prototype.unsub = function(prop, fn){
    this.adapter.unsubscribe(this.model, prop, fn);
    return this;
  };

  /**
   * Get a `prop`
   *
   * @param {String} prop
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */

  Reactive.prototype.get = function(prop) {
    return this.adapter.get(this.model, prop);
  };

  /**
   * Set a `prop`
   *
   * @param {String} prop
   * @param {Mixed} val
   * @return {Reactive}
   * @api private
   */

  Reactive.prototype.set = function(prop, val) {
    this.adapter.set(this.model, prop, val);
    return this;
  };

  /**
   * Traverse and bind all interpolation within attributes and text.
   *
   * @param {Element} el
   * @api private
   */

  Reactive.prototype.interpolate = function(el, els){

    // element
    if (el.nodeType == 1) {
      for (var i = 0; i < el.attributes.length; i++) {
        var attr = el.attributes[i];
        if (utils.hasInterpolation(attr.value)) {
          new AttrBinding(this, el, attr);
        }
      }
    }

    // text node
    if (el.nodeType == 3) {
      if (utils.hasInterpolation(el.data)) {
        debug('bind text "%s"', el.data);
        new TextBinding(this, el);
      }
    }

    // walk nodes
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      this.interpolate(node, els);
    }
  };

  /**
   * Apply all bindings.
   *
   * @api private
   */

  Reactive.prototype.bindAll = function() {
    for (var name in bindings) {
      this.bind(name, bindings[name]);
    }
  };

  /**
   * Bind `name` to `fn`.
   *
   * @param {String|Object} name or object
   * @param {Function} fn
   * @api private
   */

  Reactive.prototype.bind = function(name, fn) {
    if ('object' == typeof name) {
      for (var key in name) {
        this.bind(key, name[key]);
      }
      return;
    }

    var els = query.all('[' + name + ']', this.el);
    if (this.el.hasAttribute && this.el.hasAttribute(name)) {
      els = [].slice.call(els);
      els.unshift(this.el);
    }
    if (!els.length) return;

    debug('bind [%s] (%d elements)', name, els.length);
    for (var i = 0; i < els.length; i++) {
      var binding = new Binding(name, this, els[i], fn);
      binding.bind();
    }
  };

  /**
   * Default reactive bindings
   */
  Reactive.use(defaultBindings);

  return Reactive;
};