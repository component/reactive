/**
 * Module dependencies.
 */

var adapter = require('./adapter');
var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var debug = require('debug')('reactive');
var bindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var walk = require('dom-walk');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Bindings.
 */

exports.bindings = {};

/**
 * Define subscription function.
 *
 * @param {Function} fn
 * @api public
 */

exports.subscribe = function(fn){
  adapter.subscribe = fn;
};

/**
 * Define unsubscribe function.
 *
 * @param {Function} fn
 * @api public
 */

exports.unsubscribe = function(fn){
  adapter.unsubscribe = fn;
};

/**
 * Define a get function.
 *
 * @param {Function} fn
 * @api public
 */

exports.get = function(fn) {
  adapter.get = fn;
};

/**
 * Define a set function.
 *
 * @param {Function} fn
 * @api public
 */

exports.set = function(fn) {
  adapter.set = fn;
};

/**
 * Expose adapter
 */

exports.adapter = adapter;

/**
 * Define binding `name` with callback `fn(el, val)`.
 *
 * @param {String} name or object
 * @param {String|Object} name
 * @param {Function} fn
 * @api public
 */

exports.bind = function(name, fn){
  if ('object' == typeof name) {
    for (var key in name) {
      exports.bind(key, name[key]);
    }
    return;
  }
  exports.bindings[name] = fn;
};

/**
 * Middleware
 * @param {Function} fn
 * @api public
 */

exports.use = function(fn) {
  fn(exports);
  return this;
};

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
  this.adapter = exports.adapter;
  this.el = el;
  this.model = model;
  this.els = [];
  this.view = view || {};
  this.bindings = {};
  this.bind(exports.bindings);
}

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
 * Bind `name` to `fn`.
 *
 * @param {String|Object} name or object
 * @param {Function} fn
 * @api public
 */

Reactive.prototype.bind = function(name, fn) {
  if ('object' == typeof name) {
    for (var key in name) {
      this.bind(key, name[key]);
    }
    return;
  }
  this.bindings[name] = fn;
  return this;
};

/**
 * Walk the DOM and render all bindings
 * @param  {Function} [fn]
 * @return {void}
 * @api public
 */

Reactive.prototype.render = function(fn){
  var self = this;
  var bindings = this.bindings;

  walk(this.el, function(el, next){

    // element
    if (el.nodeType == 1) {
      var cont;

      utils.attributes(el, function(attr){
        if (utils.hasInterpolation(attr.value)) {
          new AttrBinding(self, el, attr);
        }
        else if(bindings[attr.name]) {
          var binding = new Binding(attr.name, self, el, bindings[attr.name]);
          binding.bind();
          if(binding.skip === true) {
            cont = false;
          }
        }
      });

      return next(cont);
    }

    // text node
    if (el.nodeType == 3) {
      if (utils.hasInterpolation(el.data)) {
        debug('bind text "%s"', el.data);
        new TextBinding(self, el);
      }
    }

    next();
  }, fn);
};

/**
 * Use middleware
 *
 * @api public
 */

Reactive.prototype.use = function(fn) {
  fn(this);
  return this;
};

// bundled bindings

exports.use(bindings);
