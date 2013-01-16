
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
    console.log(el);
  })
})
