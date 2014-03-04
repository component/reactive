var domify = require('domify');
var assert = require('assert');
var Emitter = require('emitter');
var clone = require('clone');

var reactive = require('../');
var adapter = clone(reactive.adapter);

// simplified backbone adapter
var BackboneAdapter = function(model) {
  if (!(this instanceof BackboneAdapter)) {
    return new BackboneAdapter(model);
  }

  var self = this;
  self.obj = model;
};

BackboneAdapter.prototype.subscribe = function(prop, fn) {
  var obj = this.obj;
  obj.on('change:' + prop, fn);
}

BackboneAdapter.prototype.unsubscribe = function(prop, fn) {
  var obj = this.obj;
  // TODO: remove check when emitter updated
  // https://github.com/component/emitter/pull/25
  if (!fn) {
    obj.off('change:' + prop);
  } else {
    obj.off('change:' + prop, fn);
  }
}

BackboneAdapter.prototype.set = function(prop, val) {
  var obj = this.obj;
  obj.set(prop, val);
}

BackboneAdapter.prototype.get = function(prop) {
  var obj = this.obj;
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

  beforeEach(function() {
    person = Person({ name: 'Matt' });
    el = domify('<div><h1 data-text="name"></h1></div>');
  });

  it('setting obj[prop] should update view', function() {
    reactive(el, person, {
      adapter: BackboneAdapter
    });
    person.set('name', 'TJ');
    assert('TJ' == el.children[0].textContent);
  });

  it('should not double set when updating reactive instance', function(done) {
    var react = reactive(el, person, {
      adapter: BackboneAdapter
    });
    react.sub('name', function(val) {
      assert.equal(val, 'TJ');
      done();
    });
    react.set('name', 'TJ');
  });

  it('shouldnt update view after being unsubscribed', function() {
    var react = reactive(el, person, {
      adapter: BackboneAdapter
    });
    react.unsub('name');
    person.set('name', 'TJ');
    assert('Matt' == el.children[0].textContent);
  });

  it('setting view should update object', function() {
    var react = reactive(el, person, {
      adapter: BackboneAdapter
    });
    react.set('name', 'TJ');
    assert('TJ' == el.children[0].textContent);
    assert('TJ' == person.get('name'));
  });
});
