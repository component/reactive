var Emitter = require('emitter');
var domify = require('domify');
var assert = require('assert');

var reactive = require('../');

describe('attr interpolation', function(){
  it('should support initialization', function(){
    var el = domify('<a href="/download/{id}"></a>');
    var user = { id: '1234' };
    var view = reactive(el, user);
    assert('/download/1234' == el.getAttribute('href'));
  })

  it('should ignore whitespace', function(){
    var el = domify('<a href="/download/{ id }"></a>');
    var user = { id: '1234' };
    var view = reactive(el, user);
    assert('/download/1234' == el.getAttribute('href'));
  })

  it('should react to changes', function(){
    var el = domify('<a href="/download/{id}"></a>');
    var user = { id: '1234' };
    Emitter(user);
    var view = reactive(el, user);

    assert('/download/1234' == el.getAttribute('href'));

    user.id = '4321';
    user.emit('change id');
    assert('/download/4321' == el.getAttribute('href'));
  })

  it('should support multiple attributes', function(){
    var el = domify('<a href="/download/{id}" id="file-{id}">Download {file}</a>');
    var user = { id: '1234' };
    Emitter(user);
    var view = reactive(el, user);

    assert('/download/1234' == el.getAttribute('href'));
    assert('file-1234' == el.getAttribute('id'));

    user.id = '4321';
    user.emit('change id');
    assert('/download/4321' == el.getAttribute('href'));
    assert('file-4321' == el.getAttribute('id'));
  })

  it('should support multiple properties', function(){
    var el = domify('<a href="/download/{id}-{file}"></a>');
    var user = { id: '1234', file: 'something' };
    Emitter(user);
    var view = reactive(el, user);

    assert('/download/1234-something' == el.getAttribute('href'));

    user.id = '4321';
    user.emit('change id');
    assert('/download/4321-something' == el.getAttribute('href'));

    user.file = 'whoop';
    user.emit('change file');
    assert('/download/4321-whoop' == el.getAttribute('href'));
  })
})
