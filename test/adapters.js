var reactive = require('reactive');
var domify = require('domify');
var assert = require('assert');
var Emitter = require('emitter');
var clone = require('clone');
var adapter = clone(reactive.adapter);

// swig template adapter
var swigReg = /\{{([^}}]+)\}}/g;
var swigTags = ['{{', '}}'];

// simplified backbone adapter

function subscribe(obj, prop, fn) {
  obj.on('change:' + prop, fn);
}

function unsubscribe(obj, prop, fn) {
  // TODO: remove check when emitter updated
  // https://github.com/component/emitter/pull/25
  if (!fn) {
    obj.off('change:' + prop);
  } else {
    obj.off('change:' + prop, fn);
  }
}

function set(obj, prop, val) {
  obj.set(prop, val);
}

function get(obj, prop) {
  return obj.get(prop);
}

// Backbone-like Model

function Person(attrs) {
  if (!(this instanceof Person)) return new Person(attrs);
  this.attrs = attrs;
}

Emitter(Person.prototype);

Person.prototype.set = function(prop, val) {
  this.attrs[prop] = val;
  this.emit('change:' + prop, val);
};

Person.prototype.get = function(prop) {
  return this.attrs[prop];
};

// Tests

describe('custom adapter', function() {
  var el, person;

  before(function() {
    reactive.subscribe(subscribe);
    reactive.unsubscribe(unsubscribe);
    reactive.set(set);
    reactive.get(get);
    reactive.interpolate(swigTags[0], swigTags[1]);
  });

  // go back to defaults to prevent leaking
  after(function() {
    reactive.subscribe(adapter.subscribe);
    reactive.unsubscribe(adapter.unsubscribe);
    reactive.set(adapter.set);
    reactive.get(adapter.get);
    reactive.interpolate(adapter.interpolation);
  });

  beforeEach(function() {
    person = Person({ name: 'Matt', age: 10 });
    el = domify('<div><h1 data-text="name"></h1><p>{{ age }}</div>');
  });

  it('setting obj[prop] should update view', function() {
    reactive(el, person);
    person.set('name', 'TJ');
    assert('TJ' == el.children[0].textContent);
  });

  it('shouldnt update view after being unsubscribed', function() {
    var react = reactive(el, person);
    react.unsub('name');
    person.set('name', 'TJ');
    assert('Matt' == el.children[0].textContent);
  });

  it('setting view should update object', function() {
    var react = reactive(el, person);
    react.set('name', 'TJ');
    assert('TJ' == el.children[0].textContent);
    assert('TJ' == person.get('name'));
  });

  it('should have inserted age property into p tag', function() {
    var react = reactive(el, person);
    assert('10' == el.children[1].textContent);
  });
});
