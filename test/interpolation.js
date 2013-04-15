
var Emitter = require('component-emitter');
var reactive = require('reactive');
var domify = require('component-domify');
var assert = require('component-assert');

describe('interpolation', function(){
  it('should initialize values', function(){
    var el = domify('<p><a data-href="/downloads/{id}" data-text="Download {title}"></a></p>')[0];

    var item = {
      title: 'Maru',
      id: 1
    };

    var view = reactive(el, item);
    var a = el.children[0];
    assert('/downloads/1' == a.getAttribute('href'));
    assert('Download Maru' == a.textContent);
  })

  it('should be reactive', function(){
    var el = domify('<p><a data-text="Download {title}: {desc}"></a></p>')[0];

    var item = {
      title: 'Maru',
      desc: 'the cat'
    };

    Emitter(item);

    var view = reactive(el, item);
    var a = el.children[0];
    assert('Download Maru: the cat' == a.textContent);

    item.emit('change title', item.title = 'Colonel meow');
    assert('Download Colonel meow: the cat' == a.textContent);

    item.emit('change desc', item.desc = 'the yeti');
    assert('Download Colonel meow: the yeti' == a.textContent);
  })
})
