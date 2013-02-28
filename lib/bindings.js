/**
 * Module dependencies.
 */

var event = require('event')
  , classes = require('classes');

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
  'mousedown',
  'mouseup',
  'blur',
  'focus',
  'input',
  'keydown',
  'keypress',
  'keyup'
];

/**
 * Apply bindings.
 */

module.exports = function(bind,reactive){

  /**
   * Generate attribute bindings.
   */

  attrs.forEach(function(attr){
    bind('data-' + attr, function(el, name, obj){
      this.change(function(){
        el.setAttribute(attr, this.interpolate(name));
      });
    });
  });

/**
 * Append child element.
 */

  bind('data-append', function(el, name){
    var other = this.value(name);
    el.appendChild(other);
  });

/**
 * Replace element.
 */

  bind('data-replace', function(el, name){
    var other = this.value(name);
    el.parentNode.replaceChild(other, el);
  });

  /**
   * Show binding.
   */

  bind('data-show', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        classes(el).add('show').remove('hide');
      } else {
        classes(el).remove('show').add('hide');
      }
    });
  });

  /**
   * Hide binding.
   */

  bind('data-hide', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        classes(el).remove('show').add('hide');
      } else {
        classes(el).add('show').remove('hide');
      }
    });
  });

  /**
   * Checked binding.
   */

  bind('data-checked', function(el, name){
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

  bind('data-text', function(el, name){
    this.change(function(){
      el.textContent = this.interpolate(name);
    });
  });

  /**
   * HTML binding.
   */

  bind('data-html', function(el, name){
    this.change(function(){
      el.innerHTML = this.formatted(name);
    });
  });

  bind('each', function(el, val){
    var self = this;
    var val = val.split(/ +/);
    el.removeAttribute('each');

    if (val.length > 1) {
      var name = val[0];
      var prop = val[2];
    } else {
      var prop = val[0];
    }

    var arr = this.value(prop);

    arr.forEach(function(obj){
      var clone = el.cloneNode(true);
      var view = reactive(clone, obj, {
        parentView: self.view,
        viewName: name
      });
      el.parentNode.appendChild(clone);
    });

    el.parentNode.removeChild(el);
  });


  /**
   * Generate event bindings.
   */

  events.forEach(function(name){
    bind('on-' + name, function(el, method){
      var fns = this.view.fns
      event.bind(el, name, function(e){
        var fn = fns[method];
        if (!fn) throw new Error('method .' + method + '() missing');
        fns[method](e);
      });
    });
  });
};
