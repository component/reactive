
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
  debug('compile `%s`', expr);
  var re = /\.\w+|\w+ *\([^\)]*\)|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  var p = props(expr);

  var body = expr.replace(re, function(_) {
    if ('(' == _[_.length - 2]) return access(_);
    if (!~p.indexOf(_)) return _;
    return wrap(_);
  });
  return new Function('model', 'view', 'return ' + body);
}

/**
 * Access a method `prop` with dot notation.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

function access(prop) {
  return '(view.' + prop.replace(/\([^\)]*\)/, '') +
    ' ? view.' + prop +
    ' : model.' + prop + ')';
}

/**
 * Wrap a `prop` in accessor logic handling properties or methods.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

function wrap(prop) {
  return '("function" == typeof view.' + prop +
    ' ? view.' + prop + '()' +
    ' : view.hasOwnProperty("' + prop + '")' +
      ' ? view.' + prop +
      ' : "function" == typeof model.' + prop +
        ' ? model.' + prop + '()' +
        ' : model.' + prop + ')';
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
