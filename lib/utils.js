
/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:utils');
var adapter = require('./adapter');
var unique = require('unique');
var props = require('props');

/**
 * Function cache.
 */

var cache = {};

/**
 * Return interpolation property names in `str`,
 * for example "{foo} and {bar}" would return
 * ['foo', 'bar'].
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.interpolationProps = function(str) {
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;

  while (m = re.exec(str)) {
    var expr = m[1];
    arr = arr.concat(props(expr));
  }

  return unique(arr);
};

/**
 * Interpolate `str` with the given `fn`.
 *
 * @param {String} str
 * @param {Function} fn
 * @return {String}
 * @api private
 */

exports.interpolate = function(str, fn){
  return str.replace(/\{([^}]+)\}/g, function(_, expr){
    var cb = cache[expr];
    if (!cb) cb = cache[expr] = compile(expr);
    return fn(expr.trim(), cb);
  });
};

/**
 * Check if `str` has interpolation.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */

exports.hasInterpolation = function(str) {
  return ~str.indexOf('{');
};

/**
 * Remove computed properties notation from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.clean = function(str) {
  return str.split('<')[0].trim();
};

/**
 * Call `prop` on `model` or `view`.
 *
 * @param {Object} model
 * @param {Object} view
 * @param {String} prop
 * @return {Mixed}
 * @api private
 */

exports.call = function(model, view, prop){
  // view method
  if ('function' == typeof view[prop]) {
    return view[prop]();
  }

  // view value
  if (view.hasOwnProperty(prop)) {
    return view[prop];
  }

  // get property from model
  return adapter.get(model, prop);
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
    return 'call(model, view, "' + prop + '")';
  });

  debug('compile `%s`', body);
  return new Function('model', 'view', 'call', 'return ' + body);
}