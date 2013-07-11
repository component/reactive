
var debug = require('debug')('reactive:attr-binding');
var inherit = require('inherit');
var utils = require('../utils');
var Binding = require('./')

module.exports = AttrBinding;

inherit(AttrBinding, Binding);

/**
 * Initialize a new attribute binding.
 *
 * @param {Reactive} view
 * @param {Attribute} attr
 * @api private
 */

function AttrBinding(view, attr) {
  this.attr = attr;
  debug('bind %s "%s"', attr.name, attr.value);
  Binding.call(this, view, attr.value);
  this.onChange();
}

/**
 * Render the value.
 */

AttrBinding.prototype.onChange = function(){
  var attr = this.attr;
  var text = this.text;
  var view = this.view;
  var obj = view.obj;

  // TODO: delegate most of this to `Reactive`
  debug('render %s "%s"', attr.name, text);
  attr.value = utils.interpolate(text, function(prop, fn){
    return fn
      ? fn(obj, view.fns, utils.call)
      : view.get(obj, prop);
  });
};
