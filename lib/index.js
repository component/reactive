/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var query = require('query');
var domify = require('domify');
var debug = require('debug')('reactive');

var Adapter = require('./adapter');
var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var bindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var walk = require('./walk');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Initialize a reactive template for `el` and `obj`.
 *
 * @param {Element} el
 * @param {Element} obj
 * @param {Object} options
 * @api public
 */

function Reactive(el, model, opt) {
  if (!(this instanceof Reactive)) return new Reactive(el, model, opt);
  opt = opt || {};

  if (typeof el === 'string') {
    el = domify(el);
  }

  var self = this;
  self.opt = opt || {};
  self.model = model || {};
  self.adapter = (opt.adapter || Adapter)(self.model);
  self.el = el;
  self.view = opt.delegate || Object.create(null);

  self.bindings = opt.bindings || Object.create(null);

  // TODO undo this crap and just export bindings regularly
  // not that binding order matters!!
  bindings({
    bind: function(name, fn) {
      self.bindings[name] = fn;
    }
  });

  self._bind(this.el, []);
}

Emitter(Reactive.prototype);

/**
 * Subscribe to changes on `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @return {Reactive}
 * @api private
 */

Reactive.prototype.sub = function(prop, fn){
  var self = this;

  debug('subscribe %s', prop);

  // if we have parts, we need to subscribe to the parent as well
  // TODO (defunctzombie) multiple levels of properties
  var parts = prop.split('.');
  if (parts.length > 1) {
    self.sub(parts[0], function() {
      // use self.get(prop) here because we wanted the value of the nested
      // property but the subscription is for the parent
      fn(self.get(prop));
    });
  }

  // for when reactive changes the property
  self.on('change ' + prop, fn);

  // for when the property changed within the adapter
  self.adapter.subscribe(prop, function() {
    // skip items set internally from calling function twice
    if (self._internal_set) return;

    fn.apply(this, arguments);
  });

  return self;
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
  this.off('change ' + prop, fn);
  this.adapter.unsubscribe(prop, fn);

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
  if (prop === 'this') {
    return this.model;
  }

  // model takes precedence
  var modelVal = this.adapter.get(prop);
  if (modelVal) {
    return modelVal;
  }

  var view = this.view;
  var viewVal = view[prop];
  if ('function' == typeof viewVal) {
    return viewVal.call(view);
  }
  else if (viewVal) {
    return viewVal;
  }

  return undefined;
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
  var self = this;
  // internal set flag lets reactive updates know to avoid triggering
  // updates for the Adapter#set call
  // we will already trigger updates with the change event
  self._internal_set = true;
  if( "object" == typeof prop) {
    Object.keys(prop).forEach(function(name){
      self.set(name, prop[name]);
    });
  }
  else {
    self.adapter.set(prop, val);
    self.emit('change ' + prop, val);
  }
  self._internal_set = false;
  return self;
};

/**
 * Traverse and bind all interpolation within attributes and text.
 *
 * @param {Element} el
 * @api private
 */

Reactive.prototype.bindInterpolation = function(el, els){

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
    this.bindInterpolation(node, els);
  }
};

Reactive.prototype._bind = function() {
  var self = this;

  var bindings = self.bindings;

  walk(self.el, function(el, next) {
    // element
    if (el.nodeType == 1) {
      var skip = false;

      var attrs = {};
      for (var i = 0; i < el.attributes.length; ++i) {
        var attr = el.attributes[i];
        var name = attr.name;
        attrs[name] = attr;
      }

      // bindings must be iterated first
      // to see if any request skipping
      // only then can we see about attributes
      Object.keys(bindings).forEach(function(name) {
        if (!attrs[name] || skip) {
          return;
        }

        debug('bind [%s]', name);

        var prop = attrs[name].value;
        var binding_fn = bindings[name];
        if (!binding_fn) {
          return;
        }

        var binding = new Binding(name, self, el, binding_fn);
        binding.bind();
        if (binding.skip) {
          skip = true;
        }
      });

      if (skip) {
        return next(skip);
      }

      // if we are not skipping
      // bind any interpolation attrs
      for (var i = 0; i < el.attributes.length; ++i) {
        var attr = el.attributes[i];
        var name = attr.name;
        if (utils.hasInterpolation(attr.value)) {
          new AttrBinding(self, el, attr);
        }
      }

      return next(skip);
    }
    // text
    else if (el.nodeType == 3) {
      if (utils.hasInterpolation(el.data)) {
        debug('bind text "%s"', el.data);
        new TextBinding(self, el);
      }
    }

    next();
  });
};

/**
 * Bind `name` to `fn`.
 *
 * @param {String|Object} name or object
 * @param {Function} fn
 * @api public
 */

Reactive.prototype.bind = function(name, fn) {
  var self = this;
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
 * Destroy the binding
 * - Removes the element from the dom (if inserted)
 * - unbinds any event listeners
 *
 * @api public
 */

Reactive.prototype.destroy = function() {
  var self = this;

  if (self.el.parentNode) {
    self.el.parentNode.removeChild(self.el);
  }

  self.adapter.unsubscribeAll();
  self.emit('destroyed');
  self.removeAllListeners();
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
