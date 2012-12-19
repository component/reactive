
var reactive = require('reactive');
var domify = require('component-domify');
var assert = require('component-assert');

describe('reactive.bind(name, fn)', function(){
  it('should define a new binding', function(done){
    reactive.bind('data-editable', function(el, url){
      el.setAttribute('contenteditable', 'true');
      assert('/item/12' == url);
      done();
    });

    var el = domify('<div><h1 data-editable="/item/12">Title</h1></div>')[0];
    reactive(el, {});
  })
})

describe('reactive.bind(obj)', function(){
  it('should define several bindings', function(done){
    reactive.bind({
      hello: function(el, val){
        assert('world' == val);
        done();
      }
    });

    var el = domify('<div><h1 hello="world">Title</h1></div>')[0];
    reactive(el, {});
  })
})

describe('Reactive#bind(name, fn)', function(){
  it('should define a view-specific binding', function(done){
    var el = domify('<ul><li removable></li></ul>')[0];
    var view = reactive(el, {});

    view.bind('removable', function(el){
      assert('LI' == el.nodeName);
      done();
    });
  })
})

describe('Reactive#bind(obj)', function(){
  it('should define several view-specific bindings', function(done){
    var el = domify('<div><form action="/login" autosubmit></form></div>')[0];
    var view = reactive(el, {});

    view.bind({
      autosubmit: function(el){
        assert('/login' == el.getAttribute('action'));
        done();
      }
    });
  })
})
