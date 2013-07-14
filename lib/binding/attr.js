
var debug = require('debug')('reactive:attr-binding');
var Binding = require('./interpolated');
var inherit = require('inherit');

/**
 * Expose AttrBinding.
 */

module.exports = AttrBinding;

/**
 * Inherit from Binding.
 */

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
  this.name = attr.name;
  debug('bind %s "%s"', attr.name, attr.value);
  Binding.call(this, view, attr.value);
  this.onChange();
}

/**
 * Render the value.
 */

AttrBinding.prototype.onChange = function(){
  debug('render %s "%s"', this.name, this.text);
  this.attr.value = this.compute();
};