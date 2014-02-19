/**
 * @api private
 */
module.exports = function walk(el, process, done) {
  var end = done || function(){};
  var nodes = [].slice.call(el.childNodes);

  function next(stop){
    if (stop || nodes.length === 0) {
      return end();
    }
    walk(nodes.shift(), process, next);
  }

  process(el, next);
}
