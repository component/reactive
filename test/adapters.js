
var reactive = require('reactive');
var domify = require('domify');
var assert = require('assert');

var user = {};

user.bind = function(event, fn){
  this._fn = fn;
};

user.trigger = function(event){
  this._fn();
};

describe('reactive.subscribe(fn)', function(){
  it('should define a subscription method', function(){
    reactive.subscribe(function(obj, prop, fn){
      obj.bind('change ' + prop, fn);
    });

    reactive.unsubscribe(function(obj, prop, fn){
      obj.unbind('change ' + prop);
    });

    var el = domify('<div><h1 data-text="name"></h1></div>')[0];
    reactive(el, user);
    user.name = 'Tobi';
    user.trigger('change name');
  })
})
