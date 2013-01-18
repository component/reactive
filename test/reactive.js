
var reactive = require('reactive');
var Emitter = require('component-emitter');
var classes = require('component-classes');
var domify = require('component-domify');
var assert = require('component-assert');

describe('reactive(el, obj)', function(){
  it('should set values on initialization', function(){
    var el = domify('<div><p data-text="name"></p></div>')[0];
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
  })

  it('should work with multiple bindings', function(){
    var el = domify('<div><span data-text="first"></span><span data-text="last"></span></div>')[0];
    var user = { first: 'Tobi', last: 'Ferret' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
    assert('Ferret' == el.children[1].textContent);
  })

  it('should support getter methods', function(){
    var el = domify('<div><p data-text="first"></p></div>')[0];

    var user = {
      _first: 'Tobi',
      first: function(){ return this._first }
    };

    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);
  });

  it('should support computed values');

  it('should support computed values on views', function(){
    var el = domify('<div><p data-text="name"></p></div>')[0];

    var user = {
      first: 'Tobi',
      last: 'Ferret'
    };

    var view = reactive(el, user, {
      name: function(){
        return user.first + ' ' + user.last
      }
    });

    assert('Tobi Ferret' == el.children[0].textContent);
  })
})

describe('on "change <name>"', function(){
  it('should update bindings', function(){
    var el = domify('<div><p data-text="name"></p></div>')[0];

    function User(name) {
      this.name = name;
    }

    Emitter(User.prototype);

    var user = new User('Tobi');
    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);

    user.name = 'Loki';
    user.emit('change name');
    assert('Loki' == el.children[0].textContent);
  })
})

describe('data-text', function(){
  it('should set element text', function(){
    var el = domify('<div><p data-text="name"></p></div>')[0];
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
  })

  it('should support formatters', function(){
    var el = domify('<div><p data-text="created_at | date:\'%Y/%M/%d\'"></p></div>')[0];
    var now = new Date;
    var user = { created_at: now };

    var view = reactive(el, user, {
      date: function(date, fmt){
        assert(now == date);
        assert(fmt == '%Y/%M/%d');
        return 'formatted date';
      }
    });

    assert('formatted date' == el.children[0].textContent);
  })
})

describe('data-html', function(){
  it('should set element html', function(){
    var el = domify('<div><p data-html="name"></p></div>')[0];
    var user = { name: '<strong>Tobi</strong>' };
    var view = reactive(el, user);
    assert('<strong>Tobi</strong>' == el.children[0].innerHTML);
  })

  it('should support computed values', function(){
    var el = domify('<div><ul data-html="fruits"></ul></div>')[0];
    var user = { diet : [ 'apples', 'pears', 'oranges' ] };
    var view = reactive(el, user, {
      fruits : function(fruits) {
        var html = user.diet.map(function(food) { return '<li>' + food + '</li>'; });
        return html.join('');
      }
    });

    var items = el.querySelectorAll('li');
    assert(3 == items.length);
    for (var i = 0, len = items.length; i < len; i++) {
      assert(user.diet[i] == items[i].textContent);
    }
  })
})

describe('data-show', function(){
  it('should add .show when truthy', function(){
    var el = domify('<div><p data-show="file">Has a file</p></div>')[0];
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('show' == el.children[0].className);
  })

  it('should remove .hide when truthy', function(){
    var el = domify('<div><p data-show="file" class="file hide">Has a file</p></div>')[0];
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('file show' == el.children[0].className);
  })
})

describe('data-hide', function(){
  it('should add .hide when truthy', function(){
    var el = domify('<div><p data-hide="file">Has a file</p></div>')[0];
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('hide' == el.children[0].className);
  })

  it('should remove .show when truthy', function(){
    var el = domify('<div><p data-hide="file" class="file show">Has a file</p></div>')[0];
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('file hide' == el.children[0].className);
  })
})

describe('data-checked', function(){
  it('should check when truthy', function(){
    var el = domify('<div><input data-checked="agree" /></div>')[0];
    var user = { agree: true };
    var view = reactive(el, user);
    assert('checked' == el.children[0].getAttribute('checked'));
  })

  it('should uncheck when falsey', function(){
    var el = domify('<div><input data-checked="agree" /></div>')[0];
    var user = { agree: false };
    var view = reactive(el, user);
    assert(null == el.children[0].getAttribute('checked'));
  })
})

describe('data-append', function(){
  it('should append an element', function(){
    var li = domify('<li>li</li>')[0];
    var el = domify('<div><ul data-append="msg"></ul></div>')[0];
    var view = reactive(el, {}, { msg: li });
    assert(li == el.children[0].children[0]);
  })
})

describe('data-replace', function(){
  it('should replace an element', function(){
    var canvas = document.createElement('canvas');
    var el = domify('<div><div data-replace="canvas"></div></div>')[0];
    var view = reactive(el, {}, { canvas: canvas });
    assert(canvas == el.children[0]);
  })
})

describe('data-[attr]', function(){
  it('should set attribute value', function(){
    var el = domify('<div><input type="text" data-value="name" /></div>')[0];
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].value);
  })

  it('should support formatters', function(){
    var el = domify('<div><a data-href="url | proxied" data-text="url"></a></div>')[0];
    var now = new Date;
    var link = { url: 'http://google.com' };

    var view = reactive(el, link, {
      proxied: function(url){
        return '/link/' + encodeURIComponent(url);
      }
    });

    var url = encodeURIComponent(link.url);
    assert('/link/' + url == el.children[0].getAttribute('href'));
    assert(link.url == el.children[0].textContent);
  })

  it('should update bindings with formatters', function(){
    var el = domify('<div><p data-text="name | toUpper"></p></div>')[0];

    function User(name) {
      this.name = name;
    }

    Emitter(User.prototype);

    var user = new User('Tobi');
    var view = reactive(el, user, {
      toUpper: function(text) {
        return text.toUpperCase();
      }
    });

    assert('TOBI' == el.children[0].textContent);

    user.name = 'Loki';
    user.emit('change name');
    assert('LOKI' == el.children[0].textContent);
  })
})
