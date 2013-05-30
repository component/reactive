
var Emitter = require('emitter');
var reactive = require('reactive');
var domify = require('domify');
var assert = require('assert');

describe('attr interpolation', function(){
  it('should support initialization', function(){
    var el = domify('<a href="/download/{id}"></a>')[0];
    var user = { id: '1234' };
    var view = reactive(el, user);
    assert('/download/1234' == el.getAttribute('href'));
  })

  it('should ignore whitespace', function(){
    var el = domify('<a href="/download/{ id }"></a>')[0];
    var user = { id: '1234' };
    var view = reactive(el, user);
    assert('/download/1234' == el.getAttribute('href'));
  })

  it('should react to changes', function(){
    var el = domify('<a href="/download/{id}"></a>')[0];
    var user = { id: '1234' };
    Emitter(user);
    var view = reactive(el, user);

    assert('/download/1234' == el.getAttribute('href'));

    user.id = '4321';
    user.emit('change id');
    assert('/download/4321' == el.getAttribute('href'));
  })

  it('should support multiple attributes', function(){
    var el = domify('<a href="/download/{id}" id="file-{id}">Download {file}</a>')[0];
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
    var el = domify('<a href="/download/{id}-{file}"></a>')[0];
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

  it('should escape html', function(){
    var el = domify('<a href="/download/{id}"></a>')[0];
    var user = { id: '">fail<' };
    var view = reactive(el, user);
    assert('/download/&quot;&gt;fail&lt;' == el.getAttribute('href'));
  })
})
