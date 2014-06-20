!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.reactive=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

function Adapter(obj) {
  if (!(this instanceof Adapter)) {
    return new Adapter(obj);
  }

  var self = this;
  self.obj = obj;
};

/**
 * Default subscription method.
 * Subscribe to changes on the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Function} fn
 */

Adapter.prototype.subscribe = function(prop, fn) {
};

/**
 * Default unsubscription method.
 * Unsubscribe from changes on the model.
 */

Adapter.prototype.unsubscribe = function(prop, fn) {
};

/**
 * Remove all subscriptions on this adapter
 */

Adapter.prototype.unsubscribeAll = function() {
};

/**
 * Default setter method.
 * Set a property on the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Mixed} val
 */

Adapter.prototype.set = function(prop, val) {
  var obj = this.obj;
  if (!obj) return;
  if ('function' == typeof obj[prop]) {
    obj[prop](val);
  }
  else if ('function' == typeof obj.set) {
    obj.set(prop, val);
  }
  else {
    obj[prop] = val;
  }
};

/**
 * Default getter method.
 * Get a property from the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @return {Mixed}
 */

Adapter.prototype.get = function(prop) {
  var obj = this.obj;
  if (!obj) {
    return undefined;
  }

  // split property on '.' access
  // and dig into the object
  var parts = prop.split('.');
  var part = parts.shift();
  do {
    if (typeof obj[part] === 'function') {
      obj = obj[part].call(obj);
    }
    else {
      obj = obj[part];
    }

    if (!obj) {
      return undefined;
    }

    part = parts.shift();
  } while(part);

  return obj;
};

module.exports = Adapter;

},{}],2:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('reactive:attr-binding');
var utils = _dereq_('./utils');

/**
 * Expose `AttrBinding`.
 */

module.exports = AttrBinding;

/**
 * Initialize a new attribute binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function AttrBinding(reactive, node, attr) {
  var self = this;
  this.reactive = reactive;
  this.node = node;
  this.attr = attr;
  this.text = attr.value;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

AttrBinding.prototype.subscribe = function(){
  var self = this;
  var reactive = this.reactive;
  this.props.forEach(function(prop){
    reactive.sub(prop, function(){
      self.render();
    });
  });
};

/**
 * Render the value.
 */

AttrBinding.prototype.render = function(){
  var attr = this.attr;
  var text = this.text;
  var reactive = this.reactive;
  var model = reactive.model;

  // TODO: delegate most of this to `Reactive`
  debug('render %s "%s"', attr.name, text);
  attr.value = utils.interpolate(text, function(prop, fn){
    if (fn) {
      return fn(reactive);
    } else {
      return reactive.get(prop);
    }
  });
};

},{"./utils":8,"debug":16}],3:[function(_dereq_,module,exports){
var hasInterpolation = _dereq_('./utils').hasInterpolation;
var interpolationProps = _dereq_('./utils').interpolationProps;

/**
 * Expose `Binding`.
 */

module.exports = Binding;

/**
 * Initialize a binding.
 *
 * @api private
 */

function Binding(name, reactive, el, fn) {
  this.name = name;
  this.reactive = reactive;
  this.model = reactive.model;
  this.view = reactive.view;
  this.el = el;
  this.fn = fn;
}

/**
 * Apply the binding.
 *
 * @api private
 */

Binding.prototype.bind = function() {
  var val = this.el.getAttribute(this.name);
  this.fn(this.el, val, this.model);
};

/**
 * Perform interpolation on `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Binding.prototype.interpolate = function(name) {
  var self = this;

  if (~name.indexOf('{')) {
    return name.replace(/{([^}]+)}/g, function(_, name){
      return self.value(name);
    });
  }

  return self.value(name);
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

Binding.prototype.value = function(name) {
  return this.reactive.get(name);
};

/**
 * Invoke `fn` on changes.
 *
 * @param {Function} fn
 * @api public
 */

Binding.prototype.change = function(fn) {
  fn.call(this);

  var self = this;
  var reactive = this.reactive;
  var val = this.el.getAttribute(this.name);

  // interpolation
  if (hasInterpolation(val)) {
    var props = interpolationProps(val);
    props.forEach(function(prop){
      reactive.sub(prop, fn.bind(self));
    });
    return;
  }

  // bind to prop
  var prop = val;
  reactive.sub(prop, fn.bind(this));
};

},{"./utils":8}],4:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var carry = _dereq_('carry');
var classes = _dereq_('classes');
var event = _dereq_('event');

var each_binding = _dereq_('./each');

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
  'class',
  'style',
  'width',
  'value',
  'height',
  'tabindex',
  'placeholder'
];

/**
 * Events supported.
 */

var events = [
  'change',
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'blur',
  'focus',
  'input',
  'submit',
  'keydown',
  'keypress',
  'keyup'
];

/**
 * Apply bindings.
 */

module.exports = function(reactive){

  reactive.bind('each', each_binding);

  /**
   * Generate attribute bindings.
   */

  attrs.forEach(function(attr){
    reactive.bind('data-' + attr, function(el, name, obj){
      this.change(function(){
        el.setAttribute(attr, this.interpolate(name));
      });
    });
  });

  /**
   * Show binding.
   */

  reactive.bind('data-visible', function(el, name){
    this.change(function(){
      var val = this.value(name);
      var show = (val instanceof Array) ? val.length > 0 : val;
      if (show) {
        classes(el).add('visible').remove('hidden');
      } else {
        classes(el).remove('visible').add('hidden');
      }
    });
  });

  /**
   * Hide binding.
   */

  reactive.bind('data-hidden', function(el, name){
    this.change(function(){
      var val = this.value(name);
      var hide = (val instanceof Array) ? val.length > 0 : val;
      if (hide) {
        classes(el).remove('visible').add('hidden');
      } else {
        classes(el).add('visible').remove('hidden');
      }
    });
  });

  /**
   * Checked binding.
   */

  reactive.bind('data-checked', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        el.setAttribute('checked', 'checked');
      } else {
        el.removeAttribute('checked');
      }
    });
  });

  /**
   * Text binding.
   */

  reactive.bind('data-text', function(el, name){
    this.change(function(){
      el.textContent = this.interpolate(name);
    });
  });

  /**
   * HTML binding.
   */

  reactive.bind('data-html', function(el, name){
    this.change(function(){
      el.innerHTML = this.interpolate(name);
    });
  });

  /**
   * Generate event bindings.
   */

  events.forEach(function(name){
    reactive.bind('on-' + name, function(el, method){
      var self = this;
      var view = self.reactive.view;
      event.bind(el, name, function(e){
        e.preventDefault();

        var fn = view[method];
        if (!fn) throw new Error('method .' + method + '() missing');
        fn.call(view, e, self.reactive);
      });
    });
  });

  /**
   * Append child element.
   */

  reactive.bind('data-append', function(el, name){
    var other = this.value(name);
    el.appendChild(other);
  });

  /**
   * Replace element, carrying over its attributes.
   */

  reactive.bind('data-replace', function(el, name){
    var other = carry(this.value(name), el);
    el.parentNode.replaceChild(other, el);
  });
};

},{"./each":5,"carry":10,"classes":14,"event":19}],5:[function(_dereq_,module,exports){
// 'each' binding
module.exports = function(el, val) {
    var self = this;

    // get the reactive constructor from the current reactive instance
    // TODO(shtylman) port over adapter and bindings from instance?
    var Reactive = self.reactive.constructor;

    var val = val.split(/ +/);
    el.removeAttribute('each');

    var name = val[0];
    var prop = val[0];

    if (val.length > 1) {
        name = val[0];
        prop = val[2];
    }

    var parent = el.parentNode;

    // use text node to hold where end of list should be
    var placeholder = document.createTextNode('');
    parent.insertBefore(placeholder, el);
    parent.removeChild(el);

    // the reactive views we created for our array
    // one per array item
    // the length of this MUST always match the length of the 'arr'
    // and mutates with 'arr'
    var views = [];

    function childView(el, model) {
        return Reactive(el, model, {
            delegate: self.view,
            adapter: self.reactive.opt.adapter
        });
    }

    // flag we set to not respond to changes we triggered
    // we trigger a change on reactive by setting a new value for the array property
    // we do this to notify any other bindings in possible size change for the array
    var internal_change = false;

    // bind entire new array
    function change(arr) {
        if (internal_change) {
            internal_change = false;
            return;
        }

        // remove any old bindings/views
        views.forEach(function(view) {
            view.destroy();
        });
        views = [];

        // splice will replace the current arr.splice function
        // so that we can intercept modifications
        var old_splice = arr.splice;
        // idx -> index to start operation
        // how many -> elements to remove
        // ... elements to insert
        // return removed elements
        var splice = function(idx, how_many) {
            var args = Array.prototype.slice.apply(arguments);

            // new items to insert if any
            var new_items = args.slice(2);

            var place = placeholder;
            if (idx < views.length) {
                place = views[idx].el;
            }

            // make views for these items
            var new_views = new_items.map(function(item) {
                var clone = el.cloneNode(true);
                return childView(clone, item);
            });

            var splice_args = [idx, how_many].concat(new_views);

            var removed = views.splice.apply(views, splice_args);

            var frag = document.createDocumentFragment();
            // insert into appropriate place
            // first removed item is where to insert
            new_views.forEach(function(view) {
                frag.appendChild(view.el);
            });

            // insert before a specific location
            // the location is defined by the element at idx
            parent.insertBefore(frag, place);

            // remove after since we may need the element for 'placement'
            // of the new document fragment
            removed.forEach(function(view) {
                view.destroy();
            });

            var ret = old_splice.apply(arr, args);

            // trigger change on the property we are iterating for other listeners
            internal_change = true;
            self.reactive.set(prop, arr);

            return ret;
        };

        /// existing methods can be implemented via splice

        var push = function(el1, el2) {
            var args = Array.prototype.slice.apply(arguments);
            var len = arr.length;

            var splice_args = [len, 0].concat(args)
            splice.apply(arr, splice_args);
            return arr.length;
        };

        var unshift = function(el1, el2) {
            var args = Array.prototype.slice.apply(arguments);
            var len = arr.length;

            var splice_args = [0, 0].concat(args)
            splice.apply(arr, splice_args);
            return arr.length;
        };

        var pop = function() {
            if (!arr.length) {
                return void 0;
            }
            var element = arr[arr.length-1];
            splice.apply(arr,[arr.length-1,1]);
            return element;
        };

        var shift = function() {
            if (!arr.length) {
                return void 0;
            }
            var element = arr[0];
            splice.apply(arr,[0,1]);
            return element;
        };

        var sort = function () {
            var ret = Array.prototype.sort.apply(arr,arguments);
            var arr2 = [0,arr.length].concat(arr);
            splice.apply(arr,arr2);
            return ret;
        };

        var reverse = function() {
            var ret = Array.prototype.reverse.apply(arr);
            var arr2 = [0,arr.length].concat(arr);
            splice.apply(arr,arr2);
            return ret;
        };

        // use defineProperty to avoid making ownProperty fields
        function set_prop(prop, fn) {
            Object.defineProperty(arr, prop, {
                enumerable: false,
                writable: true,
                value: fn
            });
        }

        set_prop('splice', splice);
        set_prop('push', push);
        set_prop('unshift', unshift);
        set_prop('pop', pop);
        set_prop('shift', shift);
        set_prop('sort', sort);
        set_prop('reverse', reverse);

        // handle initial array
        var fragment = document.createDocumentFragment();
        arr.forEach(function(obj) {
            var clone = el.cloneNode(true);
            var view = childView(clone, obj);
            views.push(view);
            fragment.appendChild(clone);
        });
        parent.insertBefore(fragment, placeholder);
    }

    change(self.reactive.get(prop) || []);
    self.skip = true;

    self.reactive.sub(prop, change);
};

},{}],6:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var Emitter = _dereq_('emitter');
var query = _dereq_('query');
var domify = _dereq_('domify');
var debug = _dereq_('debug')('reactive');

var Adapter = _dereq_('./adapter');
var AttrBinding = _dereq_('./attr-binding');
var TextBinding = _dereq_('./text-binding');
var bindings = _dereq_('./bindings');
var Binding = _dereq_('./binding');
var utils = _dereq_('./utils');
var walk = _dereq_('./walk');

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
  self.view = opt.delegate || {};

  self.bindings = {};

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

  // for when reactive changes the property
  this.on('change ' + prop, fn);

  // for when the property changed within the adapter
  this.adapter.subscribe(prop, function() {
    // skip items set internally from calling function twice
    if (self._internal_set) return;

    fn.apply(this, arguments);
  });

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
  // internal set flag lets reactive updates know to avoid triggering
  // updates for the Adapter#set call
  // we will already trigger updates with the change event
  this._internal_set = true;
  this.adapter.set(prop, val);
  this._internal_set = false;
  this.emit('change ' + prop, val);
  return this;
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

},{"./adapter":1,"./attr-binding":2,"./binding":3,"./bindings":4,"./text-binding":7,"./utils":8,"./walk":9,"debug":16,"domify":17,"emitter":18,"query":20}],7:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('reactive:text-binding');
var utils = _dereq_('./utils');

/**
 * Expose `TextBinding`.
 */

module.exports = TextBinding;

/**
 * Initialize a new text binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function TextBinding(reactive, node) {
  this.reactive = reactive;
  this.text = node.data;
  this.node = node;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

TextBinding.prototype.subscribe = function(){
  var self = this;
  var reactive = this.reactive;
  this.props.forEach(function(prop){
    reactive.sub(prop, function(){
      self.render();
    });
  });
};

/**
 * Render text.
 */

TextBinding.prototype.render = function(){
  var node = this.node;
  var text = this.text;
  var reactive = this.reactive;
  var model = reactive.model;

  // TODO: delegate most of this to `Reactive`
  debug('render "%s"', text);
  node.data = utils.interpolate(text, function(prop, fn){
    if (fn) {
      return fn(reactive);
    } else {
      return reactive.get(prop);
    }
  });
};

},{"./utils":8,"debug":16}],8:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('reactive:utils');
//var props = require('props');

/**
 * Function cache.
 */

var cache = {};

/**
 * Return possible properties of a string
 * @param {String} str
 * @return {Array} of properties found in the string
 * @api private
 */
var props = function(str) {
  return str
    .replace(/\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .match(/[a-zA-Z_]\w*([.][a-zA-Z_]\w*)*/g)
    || [];
};
/**
 * Return interpolation property names in `str`,
 * for example "{foo} and {bar}" would return
 * ['foo', 'bar'].
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.interpolationProps = function(str) {
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;

  while (m = re.exec(str)) {
    var expr = m[1];
    arr = arr.concat(props(expr));
  }

  return unique(arr);
};

/**
 * Interpolate `str` with the given `fn`.
 *
 * @param {String} str
 * @param {Function} fn
 * @return {String}
 * @api private
 */

exports.interpolate = function(str, fn){
  return str.replace(/\{([^}]+)\}/g, function(_, expr){
    var cb = cache[expr];
    if (!cb) cb = cache[expr] = compile(expr);
    var val = fn(expr.trim(), cb);
    return val == null ? '' : val;
  });
};

/**
 * Check if `str` has interpolation.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */

exports.hasInterpolation = function(str) {
  return ~str.indexOf('{');
};

/**
 * Compile `expr` to a `Function`.
 *
 * @param {String} expr
 * @return {Function}
 * @api private
 */

function compile(expr) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*/g;
  var p = props(expr);

  var body = expr.replace(re, function(_) {
    if (p.indexOf(_) >= 0) {
      return access(_);
    };

    return _;
  });

  debug('compile `%s`', body);
  return new Function('reactive', 'return ' + body);
}

/**
 * Access a method `prop` with dot notation.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

function access(prop) {
  return 'reactive.get(\'' + prop + '\')';
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

},{"debug":16}],9:[function(_dereq_,module,exports){
/**
 * @api private
 */
module.exports = function walk(el, process, done) {
  var end = done || function(){};
  var nodes = [].slice.call(el.childNodes);

  function next(stop){
    if (stop || nodes.length === 0) {
      return end();
    }
    walk(nodes.shift(), process, next);
  }

  process(el, next);
}

},{}],10:[function(_dereq_,module,exports){

/**
 * dependencies
 */

var merge = _dereq_('./lib/merge-attrs')
  , classes = _dereq_('classes')
  , uniq = _dereq_('uniq');

/**
 * Export `carry`
 */

module.exports = carry;

/**
 * Carry over attrs and classes
 * from `b` to `a`.
 *
 * @param {Element} a
 * @param {Element} b
 * @return {Element}
 * @api public
 */

function carry(a, b){
  if (!a) return b.cloneNode();
  carry.attrs(a, b);
  carry.classes(a, b);
  return a;
}

/**
 * Carry attributes.
 *
 * @param {Element} a
 * @param {Element} b
 * @return {Element} a
 * @api public
 */

carry.attrs = function(a, b){
  merge(a, b);
  return a;
};

/**
 * Carry over classes.
 *
 * @param {Element} a
 * @param {Element} b
 * @return {Element} a
 * @api public
 */

carry.classes = function(a, b){
  if (a.className == b.className) return a;
  var blist = classes(b).array();
  var alist = classes(a).array();
  var list = alist.concat(blist);
  a.className = uniq(list).join(' ');
  return a;
};

},{"./lib/merge-attrs":11,"classes":14,"uniq":12}],11:[function(_dereq_,module,exports){

/**
 * Export `merge`
 */

module.exports = merge;

/**
 * Merge `b`'s attrs into `a`.
 *
 * @param {Element} a
 * @param {Element} b
 * @api public
 */

function merge(a, b){
  for (var i = 0; i < b.attributes.length; ++i) {
    var attr = b.attributes[i];
    if (ignore(a, attr)) continue;
    a.setAttribute(attr.name, attr.value);
  }
}

/**
 * Check if `attr` should be ignored.
 *
 * @param {Element} a
 * @param {Attr} attr
 * @return {Boolean}
 * @api private
 */

function ignore(a, attr){
  return !attr.specified
    || 'class' == attr.name
    || 'id' == attr.name
    || a.hasAttribute(attr.name);
}

},{}],12:[function(_dereq_,module,exports){

/**
 * dependencies
 */

var indexOf = _dereq_('indexof');

/**
 * Create duplicate free array
 * from the provided `arr`.
 *
 * @param {Array} arr
 * @param {Array} select
 * @return {Array}
 */

module.exports = function (arr, select) {
  var len = arr.length, ret = [], v;
  select = select ? (select instanceof Array ? select : [select]) : false;

  for (var i = 0; i < len; i++) {
    v = arr[i];
    if (select && !~indexOf(select, v)) {
      ret.push(v);
    } else if (!~indexOf(ret, v)) {
      ret.push(v);
    }
  }
  return ret;
};

},{"indexof":13}],13:[function(_dereq_,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],14:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var index = _dereq_('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

},{"indexof":15}],15:[function(_dereq_,module,exports){
module.exports=_dereq_(13)
},{}],16:[function(_dereq_,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],17:[function(_dereq_,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');
  
  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = document.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],18:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],19:[function(_dereq_,module,exports){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

},{}],20:[function(_dereq_,module,exports){

function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
};

},{}]},{},[6])
(6)
});