
var debug = require('debug')('reactive:text-binding');
var inherit = require('inherit');
var utils = require('../utils');
var Binding = require('./');

module.exports = TextBinding;

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