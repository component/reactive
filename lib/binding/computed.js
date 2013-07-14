
var inherit = require('inherit');
var Binding = require('./base');
var debug = Binding.debug;

/**
 * Expose Computed
 */

module.exports = Computed;

/**
 * Inherit from Binding
 */

inherit(Computed, Binding);

/**
 * Computed Binding class
 * 
 * @param {Reactive} view
 * @param {String} text
 */

function Computed(view, text){
  Binding.call(this, view, text);
}

/**
 * `foo < bar baz` returns `['bar', 'baz']`
 */

Computed.prototype.dependencies = function(str){
  return str
    .slice(str.indexOf('<') + 1)
    .trim()
    .split(/\s+/);
}

/**
 * unimplemented
 */

Computed.prototype.compute