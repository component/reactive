/**
 * Module dependencies.
 */

var classes = require('classes');
var event = require('event');

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
      if (this.value(name)) {
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
      if (this.value(name)) {
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
      el.innerHTML = this.formatted(name);
    });
  });

  /**
   * Generate event bindings.
   */

  events.forEach(function(name){
    reactive.bind('on-' + name, function(el, method){
      var view = this.reactive.view;
      event.bind(el, name, function(e){
        var fn = view[method];
        if (!fn) throw new Error('method .' + method + '() missing');
        view[method](e);
      });
    });
  });

  /**
   * Conditional binding.
   */

  reactive.bind('data-if', function(el, name){
    var value = this.value(name);
    if (!value) el.parentNode.removeChild(el);
  });

  /**
   * Append child element.
   */

  reactive.bind('data-append', function(el, name){
    var other = this.value(name);
    el.appendChild(other);
  });

  /**
   * Replace element.
   */

  reactive.bind('data-replace', function(el, name){
    var other = this.value(name);

    // carryover attributes
    for (var key in el.attributes) {
      var attr = el.attributes[key];
      if (!attr.specified || 'class' == attr.name) continue;
      if (!other.hasAttribute(attr.name)) other.setAttribute(attr.name, attr.value);
    }

    // carryover classes
    var arr = classes(el).array();
    for (var i = 0; i < arr.length; i++) {
      classes(other).add(arr[i]);
    }

    el.parentNode.replaceChild(other, el);
  });

};
