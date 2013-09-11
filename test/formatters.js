
var Emitter = require('emitter');
var reactive = require('reactive');
var domify = require('domify');
var assert = require('assert');

describe('string formatters', function(){
  it('should define a formatter', function(){
    reactive.format('foo', function(){
      return 'bar';
    })
    var el = domify('<p data-text="name | foo"></p>');
    reactive(el, {});
    assert( el.innerHTML === "bar" )
  })
})
