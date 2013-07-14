
var debug = require('debug')('reactive:text-binding');
var Binding = require('./interpolated');
var inherit = require('inherit');

/**
 * Expose TextBinding.
 */

module.exports = TextBinding;

/**
 * Inherit from Binding.
 */

inherit(TextBinding, Binding)

/**
 * Initialize a new text binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 */

function TextBinding(view, node) {
  this.node = node;
  debug('bind text "%s"', node.data);
  Binding.call(this, view, node.data);
  this.onChange();
}

/**
 * Render text.
 */

TextBinding.prototype.onChange = function(){
  debug('render "%s"', this.text);
  this.node.data = this.compute();
};