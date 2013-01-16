
var reactive = require('reactive');
var domify = require('component-domify');
var assert = require('component-assert');

describe('interpolation', function(){
  it('should work', function(){
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
})
