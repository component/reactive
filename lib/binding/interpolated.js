
var adapter = require('../adapter');
var inherit = require('inherit');
var Binding = require('./base');
var unique = require('unique');
var props = require('props');
var get = Binding.getValue;
var debug = Binding.debug;

/**
 * Expose Interpolated
 */

module.exports = Interpolated;

/**
 * Inherit from Binding
 */

inherit(Interpolated, Binding);

/**
 * Interpolated Binding class
 * 
 * @param {Reactive} view
 * @param {String} text
 */

function Interpolated(view, text){
	Binding.call(this, view, text);
}

/**
 * `{foo} and {bar}` returns `['foo', 'bar']`
 */

Interpolated.prototype.dependencies = function(str){
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;

  while (m = re.exec(str)) {
    var expr = m[1];
    arr = arr.concat(props(expr));
  }

  return unique(arr);
}

/**
 * Function cache.
 */

var cache = {};

Interpolated.prototype.compute = function(){
  var view = this.view;
  return this.text.replace(/\{([^}]+)\}/g, function(_, expr){
    expr = expr.trim();
    var cb = cache[expr];
    if (!cb) cb = cache[expr] = compile(expr);
    return cb(view.obj, view.fns, get);
  });
};

/**
 * Compile `expr` to a `Function`.
 *
 * @param {String} expr
 * @return {Function}
 * @api private
 */

function compile(expr) {
  var body = props(expr, function(prop) {
    // definitly a method
    if ('(' == prop[prop.length - 1]) return 'model.' + prop;
    // maybe a method
    return 'get(model, view, "' + prop + '")';
  });

  debug('compile `%s`', body);
  return new Function('model', 'view', 'get', 'return ' + body);
}