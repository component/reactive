/**
 * Module dependencies.
 */

var carry = require('carry');
var classes = require('classes');
var event = require('event');

var each_binding = require('./each');

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
  'mouseenter',
  'mouseleave',
  'scroll',
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
      var change = function () {
        el.setAttribute(attr, this.interpolate(name));
      };

      if (!!~['INPUT', 'TEXTAREA'].indexOf(el.tagName) && attr === 'value') {
        change = function () {
          el.value = this.interpolate(name);
        };
      }

      this.change(change);
    });
  });

  /**
   * Show binding.
   */

  reactive.bind('data-visible', function(el, name){
    this.change(function(){
      var val = this.value(name);
      if (val) {
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
      if (val) {
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
   * Selected binding.
   */

  reactive.bind('data-selected', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        el.setAttribute('selected', 'selected');
      } else {
        el.removeAttribute('selected');
      }
    });
  });

  /**
   * Text binding.
   */

  reactive.bind('data-text', function(el, name){
    var change = function () {
      el.textContent = this.interpolate(name);
    };

    if (el.tagName === 'TEXTAREA') {
      change = function () {
        el.value = this.interpolate(name);
      };
    }

    this.change(change);
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
