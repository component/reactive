var classes = require('classes');
var domify = require('domify');
var assert = require('assert');

var reactive = require('../');

describe('reactive(el, obj)', function(){
  it('should set values on initialization', function(){
    var el = domify('<div><p data-text="name"></p></div>');
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
  })

  it('should implicitly domify on initialization', function(){
    var tmpl = '<p data-text="name"></p>';
    var user = { name: 'Tobi' };
    var view = reactive(tmpl, user);
    var el = view.el;
    assert('Tobi' == el.textContent);
  })

  it('should work with multiple bindings', function(){
    var el = domify('<div><span data-text="first"></span><span data-text="last"></span></div>');
    var user = { first: 'Tobi', last: 'Ferret' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
    assert('Ferret' == el.children[1].textContent);
  })

  it('should support getter methods', function(){
    var el = domify('<div><p data-text="first"></p></div>');

    var user = {
      _first: 'Tobi',
      first: function(){ return this._first }
    };

    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);
  });

  it('should support computed values on views', function(){
    var el = domify('<div><p data-text="name"></p></div>');

    var user = {
      first: 'Tobi',
      last: 'Ferret'
    };

    var delegate = {
      name: function(){
        assert(delegate == this);
        return user.first + ' ' + user.last
      }
    };

    var view = reactive(el, user, {
      delegate: delegate
    });

    assert('Tobi Ferret' == el.children[0].textContent);
  })

  it('should support nested properties', function(){
    var el = domify('<div>{name.first} {name.last}</div>');

    var user = {
      name: {
        first: 'Tobi',
        last: 'Ferret'
      }
    };

    var view = reactive(el, user);
    assert('Tobi Ferret' == el.textContent);
  })

  it('should support deeply nested properties', function(){
    var model = { foo: { bar: { baz: { rofl: 'ok' } } } };
    var view = reactive(domify('<div>{ foo.bar.baz.rofl }</div>'), model);
    assert('ok' == view.el.textContent);
  })

  it('should not fail for undefined properties', function(){
    var view = reactive(domify('<div>{ foo }</div>'), {});
    assert.equal('', view.el.textContent);

    var view = reactive(domify('<div>{ foo.bar }</div>'), {});
    assert.equal('', view.el.textContent);
  });

  it('shouldnt update view after being destroyed', function(done) {
    var el = domify('<div><h1 data-text="name"></h1></div>');
    var react = reactive(el, { name: 'Matt' });
    assert('Matt' == el.children[0].textContent);

    react.on('destroyed', function() {
      done();
    });

    // should unbind any handlers to the model and any internal handlers
    react.destroy();

    react.set('name', 'TJ');
    assert('Matt' == el.children[0].textContent);
  });
})

describe('.set(prop, value)', function(){
  it('should update bindings', function(){
    var el = domify('<div><p data-text="name"></p></div>');

    function User(name) {
      this.name = name;
    }

    var user = new User('Tobi');
    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);

    view.set('name', 'Loki');
    assert('Loki' == el.children[0].textContent);
  });

  it('should update bindings from an object', function(){
    var el = domify('<div><p>{name}</p><p>{age}</p></div>');

    function User(name, age) {
      this.name = name;
      this.age = age;
    }

    var user = new User('Tobi', 24);
    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);
    assert('24' == el.children[1].textContent);

    view.set('name', 'Loki');
    view.set('age', '21');
    assert('Loki' == el.children[0].textContent);
    assert('21' == el.children[1].textContent);

    view.set({
      'name': 'Barry',
      'age': 33
    });
    assert('Barry' == el.children[0].textContent);
    assert('33' == el.children[1].textContent);
  });

  it('should support setting parent property of a nested property', function() {
    var el = domify('<div>{user.name} {user.age}</div>');

    var view = reactive(el, { user: { name: 'Keith', age: 45 } });
    assert.equal(el.textContent, 'Keith 45');

    view.set('user', { name: 'Seth', age: 50 });
    assert.equal(el.textContent, 'Seth 50');
  });
})

describe('data-text', function(){
  it('should set element text', function(){
    var el = domify('<div><p data-text="name"></p></div>');
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
  })
})

describe('data-html', function(){
  it('should set element html', function(){
    var el = domify('<div><p data-html="name"></p></div>');
    var user = { name: '<strong>Tobi</strong>' };
    var view = reactive(el, user);
    assert('<strong>Tobi</strong>' == el.children[0].innerHTML);
  })

  it('should support computed values', function(){
    var el = domify('<div><ul data-html="fruits"></ul></div>');
    var user = { diet : [ 'apples', 'pears', 'oranges' ] };
    var view = reactive(el, user, { delegate: {
      fruits : function(fruits) {
        var html = user.diet.map(function(food) { return '<li>' + food + '</li>'; });
        return html.join('');
      }
    }});

    var items = el.querySelectorAll('li');
    assert(3 == items.length);
    for (var i = 0, len = items.length; i < len; i++) {
      assert(user.diet[i] == items[i].textContent);
    }
  })
})

describe('data-visible', function(){
  it('should add .visible when truthy', function(){
    var el = domify('<div><p data-visible="file">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('visible' == el.children[0].className);
  })

  it('should remove .hidden when truthy', function(){
    var el = domify('<div><p data-visible="file" class="file hidden">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('file visible' == el.children[0].className);
  })

  it('should add .hidden when array is empty', function() {
    var tmpl = '<ul data-visible="items.length"><li each="items"></li></ul>';
    var view = reactive(tmpl, { items: [] });
    assert('hidden' == view.el.className);
  })

  it('should add .visible when array is not empty', function() {
    var tmpl = '<ul data-visible="items.length"><li each="items"></li></ul>';
    var view = reactive(tmpl, { items: [ 'one' ] });
    assert('visible' == view.el.className);
  })

  it('should update on array changes', function() {
    var tmpl = '<ul data-visible="items.length"><li each="items">{this}</li></ul>';
    var model = { items: [] };
    var view = reactive(tmpl, model);
    assert('hidden' == view.el.className);
    model.items.push('one');
    assert('visible' == view.el.className);
    assert.equal('one', view.el.children[0].textContent);
  })
})

describe('data-hidden', function(){
  it('should add .hidden when truthy', function(){
    var el = domify('<div><p data-hidden="file">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('hidden' == el.children[0].className);
  })

  it('should remove .visible when truthy', function(){
    var el = domify('<div><p data-hidden="file" class="file visible">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('file hidden' == el.children[0].className);
  })

  it('should add .visible when array is empty', function() {
    var tmpl = '<ul data-hidden="items.length"><li each="items"></li></ul>';
    var view = reactive(tmpl, { items: [] });
    assert('visible' == view.el.className);
  })

  it('should add .hidden when array is not empty', function() {
    var tmpl = '<ul data-hidden="items.length"><li each="items"></li></ul>';
    var view = reactive(tmpl, { items: [ 'one' ] });
    assert('hidden' == view.el.className);
  })

})

describe('data-checked', function(){
  it('should check when truthy', function(){
    var el = domify('<div><input data-checked="agree" /></div>');
    var user = { agree: true };
    var view = reactive(el, user);
    assert('checked' == el.children[0].getAttribute('checked'));
  })

  it('should uncheck when falsey', function(){
    var el = domify('<div><input data-checked="agree" /></div>');
    var user = { agree: false };
    var view = reactive(el, user);
    assert(null == el.children[0].getAttribute('checked'));
  })
})

describe('data-append', function(){
  it('should append an element', function(){
    var li = domify('<li>li</li>');
    var el = domify('<div><ul data-append="msg"></ul></div>');
    var view = reactive(el, {}, { delegate: { msg: li } });
    assert(li == el.children[0].children[0]);
  })
})

describe('data-replace', function(){
  it('should replace an element', function(){
    var canvas = document.createElement('canvas');
    var el = domify('<div><div data-replace="canvas"></div></div>');
    var view = reactive(el, {}, { delegate: { canvas: canvas } });
    assert(canvas == el.children[0]);
  })

  it('should carryover attributes', function(){
    var input = document.createElement('input');
    var el = domify('<div><div type="email" data-replace="input"></div>');
    var view = reactive(el, {}, { delegate: { input: input } });
    assert('email' == input.type);
  })

  it('shouldnt wipe out existing attributes', function(){
    var input = document.createElement('input');
    input.type = 'url'
    var el = domify('<div><div type="email" data-replace="input"></div>');
    var view = reactive(el, {}, { delegate: { input: input } });
    assert('url' == input.type);
  })

  it('should carryover classes', function(){
    var toggle = document.createElement('toggle');
    toggle.className = 'toggle';
    var el = domify('<div><div class="integration-toggle" data-replace="toggle"></div></div>');
    var view = reactive(el, {}, { delegate: { toggle: toggle } });
    assert('toggle integration-toggle' == toggle.className);
  })
})

describe('data-[attr]', function(){
  it('should set attribute value', function(){
    var el = domify('<div><input type="text" data-value="name" /></div>');
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].value);
  })
})
