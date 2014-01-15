var Emitter = require('emitter');
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

    var view = reactive(el, user, {
      name: function(){
        return user.first + ' ' + user.last
      }
    });

    assert('Tobi Ferret' == el.children[0].textContent);
  })

  // it('should support the root element', function(){
  //   var el = domify('<p data-text="name"></p>')[0];
  //   var user = { name: 'Tobi' };
  //   reactive(el, user);
  //   console.log(el);
  //   assert('Tobi' == el.textContent);
  // })
})

describe('on "change <name>"', function(){
  it('should update bindings', function(){
    var el = domify('<div><p data-text="name"></p></div>');

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
    var el = domify('<div><p data-text="name"></p></div>');
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
  })

  it('should support formatters', function(){
    var el = domify('<div><p data-text="created_at | date:\'%Y/%M/%d\'"></p></div>');
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
    var el = domify('<div><p data-html="name"></p></div>');
    var user = { name: '<strong>Tobi</strong>' };
    var view = reactive(el, user);
    assert('<strong>Tobi</strong>' == el.children[0].innerHTML);
  })

  it('should support computed values', function(){
    var el = domify('<div><ul data-html="fruits"></ul></div>');
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
    var view = reactive(el, {}, { msg: li });
    assert(li == el.children[0].children[0]);
  })
})

describe('data-replace', function(){
  it('should replace an element', function(){
    var canvas = document.createElement('canvas');
    var el = domify('<div><div data-replace="canvas"></div></div>');
    var view = reactive(el, {}, { canvas: canvas });
    assert(canvas == el.children[0]);
  })

  it('should carryover attributes', function(){
    var input = document.createElement('input');
    var el = domify('<div><div type="email" data-replace="input"></div>');
    var view = reactive(el, {}, { input: input });
    assert('email' == input.type);
  })

  it('shouldnt wipe out existing attributes', function(){
    var input = document.createElement('input');
    input.type = 'url'
    var el = domify('<div><div type="email" data-replace="input"></div>');
    var view = reactive(el, {}, { input: input });
    assert('url' == input.type);
  })

  it('should carryover classes', function(){
    var toggle = document.createElement('toggle');
    toggle.className = 'toggle';
    var el = domify('<div><div class="integration-toggle" data-replace="toggle"></div></div>');
    var view = reactive(el, {}, { toggle: toggle });
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

  it('should support formatters', function(){
    var el = domify('<div><a data-href="url | proxied" data-text="url"></a></div>');
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
    var el = domify('<div><p data-text="name | toUpper"></p></div>');

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
