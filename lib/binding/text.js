
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
  this.view = view;
  this.node = node;
  this.text = node.data;
  debug('bind text "%s"', this.text);
  this.props = this.dependencies(this.text);
  this.listen();
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