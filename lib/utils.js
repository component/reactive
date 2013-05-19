
/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:utils');
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
    if (isSimple(expr)) {
      arr.push(expr);
    } else {
      arr = arr.concat(props(expr));
    }
  }

  return unique(arr);
};

/**
 * Interpolate `str` with the given `fn`.
 *
 * TODO: cache compiled function
 *
 * @param {String} str
 * @param {Function} fn
 * @return {String}
 * @api private
 */

exports.interpolate = function(str, fn){
  return str.replace(/\{([^}]+)\}/g, function(_, expr){
    var callback;

    if (!isSimple(expr)) {
      callback = cache[expr] || (cache[expr] = compile(expr));
    }

    return fn(expr.trim(), callback);
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
 * Compile `expr` to a `Function`.
 *
 * @param {String} expr
 * @return {Function}
 * @api private
 */

function compile(expr) {
  expr = 'return ' + props(expr, 'model.');
  debug('compile `%s`', expr);
  return new Function('model', expr);
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Check if `expr` is "simple" and
 * may be optimized to reduce compiled functions.
 *
 * @param {String} expr
 * @return {Boolean}
 * @api private
 */

function isSimple(expr) {
  return expr.match(/^ *\w+ *$/);
}
