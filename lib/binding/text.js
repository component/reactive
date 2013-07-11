
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
  var node = this.node;
  var text = this.text;
  var view = this.view;
  var obj = view.obj;

  // TODO: extract into a `compute` method
  debug('render "%s"', text);
  node.data = utils.interpolate(text, function(prop, fn){
    return fn
      ? fn(obj, view.fns, utils.call)
      : view.get(obj, prop);
  });
};