

var utils = require('../utils');
var hasInterpolation = utils.hasInterpolation;

exports = module.exports = function(view, text){
	return new exports[type(text)](view, text);
}

exports.interpolated = require('./interpolated');
exports.computed = require('./computed');
exports.formatted = require('./formatted');

/**
 * determine the type of string we are animating
 * 
 * @param {String} text
 * @return {String}
 * @api private
 */

function type(text){
  if (hasInterpolation(text)) return 'interpolated';
  if (text.indexOf('<') > 0) return 'computed';
  return 'formatted';
}