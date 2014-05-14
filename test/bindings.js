var domify = require('domify');
var assert = require('assert');

var reactive = require('../');

describe('reactive.bind(name, fn)', function(){
  it('should define a new binding', function(done){
    var el = domify('<div><h1 data-editable="/item/12">Title</h1></div>');
    var react = reactive(el, {}, {
      bindings: {
        'data-editable': function(el, url){
          el.setAttribute('contenteditable', 'true');
          assert('/item/12' == url);
        }
      }
    });

    assert(el.children[0].getAttribute('contenteditable'));
    done();
  })

  it('should pass bindings onto each', function(done){
    var el = domify('<div><h1 each="todos"><span lowercase="title"></span></h1></div>');
    var model = {
      todos: [ { title: 'test title' } ]
    };
    var react = reactive(el, model, {
      bindings: {
        'lowercase': function(el, prop){
          var binding = this;
          assert(prop === 'title');
          var val = binding.value(prop);
          assert(val === 'test title');
          done();
        }
      }
    });
  });
})

describe('reactive.bind(obj)', function(){
  it('should define several bindings', function(done){
    var el = domify('<div><h1 hello="world">Title</h1></div>');
    var react = reactive(el, {}, {
      bindings: {
        'hello': function(el, val){
          assert('world' == val);
          done();
        }
      }
    });
  })
})

describe('Reactive#bind(name, fn)', function(){
  it('should initialize a view-specific binding', function(done){
    var el = domify('<ul><li removable></li></ul>');
    var view = reactive(el, {}, {
      bindings: {
        'removable': function(el){
          assert('LI' == el.nodeName);
          done();
        }
      }
    });
  })

  it('should support root-level bindings', function(done){
    var el = domify('<ul removable><li></li></ul>');
    var view = reactive(el, {}, {
      bindings: {
        'removable': function(el){
          assert('UL' == el.nodeName);
          done();
        }
      }
    });
  })
})

describe('Reactive#bind(name, fn)', function(){
  it('should not use setAttribute to update input\'s value', function(){
    var el = domify('<input data-value="value" />');
    var view = reactive(el, { value: 'old value' });
    view.el.value = 'old value';

    assert(el.value == 'old value');
    view.set('value', 'value');
    assert(el.value == 'value');
  })

  it('should not use setAttribute to update textarea\'s value', function(){
    var el = domify('<textarea data-value="value"></textarea>');
    var view = reactive(el, { value: 'old value' });
    view.set('value', 'value');
    assert(el.value == 'value');
  })

  it('should change value of `.value` to update textarea\'s text content', function(){
    var el = domify('<textarea data-text="value"></textarea>');
    var view = reactive(el, { value: 'old value' });
    view.set('value', 'value');
    assert(el.value == 'value');
  })
})
