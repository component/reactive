
/**
 * Module dependencies.
 */

var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var walkDown = require('tree-each/depth');
var debug = require('debug')('reactive');
var bindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var query = require('query');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Bindings.
 */

exports.bindings = {};

/**
 * Default subscription method.
 */

function subscribe(obj, prop, fn) {
  if (!obj.on) return;
  obj.on('change ' + prop, fn);
};

/**
 * Default unsubscription method.
 */

function unsubscribe(obj, prop, fn) {
  if (!obj.off) return;
  obj.off('change ' + prop, fn);
};

/**
 * Define subscription function.
 *
 * @param {Function} fn
 * @api public
 */

exports.subscribe = function(fn){
  subscribe = fn;
  Binding.subscribe = fn;
};

/**
 * Define unsubscribe function.
 *
 * @param {Function} fn
 * @api public
 */

exports.unsubscribe = function(fn){
  unsubscribe = fn;
  Binding.unsubscribe = fn;
};

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
 * generate iteration utilities
 * 
 * @param {Element} el
 * @param {Function} fn
 * @param {Object} [ctx]
 * @api private
 */

var walk = walkDown('children');
var walkAll = walkDown('childNodes');

/**
 * Initialize a reactive template for `el` and `obj`.
 *
 * @param {Element} el
 * @param {Element} obj
 * @param {Object} options
 * @api public
 */

function Reactive(el, obj, options) {
  if (!(this instanceof Reactive)) return new Reactive(el, obj, options);
  this.el = el;
  this.obj = obj;
  this.els = [];
  this.fns = options || {};
  walk(el, bindHandlers, this);
  walkAll(el, bindInterpolation, this);
}

/**
 * Subscribe to changes on `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @api private
 */

Reactive.prototype.sub = function(prop, fn){
  subscribe(this.obj, prop, fn);
};

/**
 * Unsubscribe to changes from `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @api public
 */

Reactive.prototype.unsub = function(prop, fn){
  unsubscribe(this.obj, prop, fn);
};

/**
 * bind all interpolation within attributes and text
 *
 * @param {Element} el
 * @api private
 */

function bindInterpolation(el){
  // element
  if (Node.ELEMENT_NODE == el.nodeType) {
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (utils.hasInterpolation(attr.value)) {
        new AttrBinding(this, el, attr);
      }
    }
  }

  // text node
  if (Node.TEXT_NODE == el.nodeType) {
    if (utils.hasInterpolation(el.data)) {
      debug('bind text "%s"', el.data);
      new TextBinding(this, el);
    }
  }
}

/**
 * bind special attributes to their handlers
 * 
 * @param {Element} el
 * @api private
 */

function bindHandlers(el){
  var attrs = el.attributes;
  for (var i = 0, len = attrs.length; i < len; i++) {
    var name = attrs[i].name;
    var fn = exports.bindings[name];
    if (fn) {
      debug('bind %s[%s]', el.tagName, name);
      new Binding(name, this, el, fn).bind();
    }
  }
}

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

  var obj = this.obj;
  var els = query.all('[' + name + ']', this.el);
  if (!els.length) return;

  debug('bind [%s] (%d elements)', name, els.length);
  for (var i = 0; i < els.length; i++) {
    new Binding(name, this, els[i], fn).bind();
  }
};

// bundled bindings

bindings(exports.bind);
