
var parse = require('format-parser');
var inherit = require('inherit');
var Binding = require('./base');
var debug = Binding.debug;

/**
 * Expose Formatted
 */

module.exports = Formatted;

/**
 * Inherit from Binding
 */

inherit(Formatted, Binding);

/**
 * Formatted Binding class
 * 
 * @param {Reactive} view
 * @param {String} text
 */

function Formatted(view, text){
	this.calls = parse(text);
  Binding.call(this, view, text);
}

/**
 * `birthdate | date:'%Y %d'` returns `['birthdate']`
 */

Formatted.prototype.dependencies = function(str){
  return [this.calls[0].name];
}

Formatted.prototype.compute = function(){
  var calls = this.calls;
  var name = calls[0].name;
  var val = this.value(name);

  for (var i = 1; i < calls.length; ++i) {
    var call = calls[i];
    call.args.unshift(val);
    var fn = this.fns[call.name];
    val = fn.apply(this.fns, call.args);
  }

  return val;
}