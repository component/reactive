
var Emitter = require('emitter');
var reactive = require('reactive');
var domify = require('domify');
var assert = require('assert');

describe('text interpolation', function(){
  it('should support initialization', function(){
    var el = domify('<div><a href="/download/{id}"><strong>Download</strong> {file}</a></div>')[0];
    var user = { id: '1234', file: 'tobi.png' };
    var view = reactive(el, user);
    assert('Download tobi.png' == el.children[0].textContent);
  })

  it('should ignore whitespace', function(){
    var el = domify('<div><a href="/download/{ id }"><strong>Download</strong> { file }</a></div>')[0];
    var user = { id: '1234', file: 'tobi.png' };
    var view = reactive(el, user);
    assert('Download tobi.png' == el.children[0].textContent);
  })

  it('should react to changes', function(){
    var el = domify('<div><a href="/download/{id}"><strong>Download</strong> {file}</a></div>')[0];
    var user = { id: '1234', file: 'tobi.png' };
    Emitter(user);

    var view = reactive(el, user);
    assert('Download tobi.png' == el.children[0].textContent);

    user.file = 'loki.png';
    user.emit('change file', 'loki.png');
    assert('Download loki.png' == el.children[0].textContent);
  })

  it('should support multiple properties', function(){
    var el = domify('<div><p>{first} {last} is a {species}</p></div>')[0];
    var pet = { first: 'tobi', last: 'holowaychuk', species: 'ferret' };
    var view = reactive(el, pet);
    assert('tobi holowaychuk is a ferret' == el.children[0].textContent);
  })

  it('should support model method calls', function(){
    var el = domify('<p>first: {@first()}</p>')[0];

    var pet = {
      first: function(){
        return 'Loki'
      }
    };

    reactive(el, pet);
    assert('first: Loki' == el.textContent);
  })

  it('should support a single method call without leading @', function(){
    var el = domify('<p>first: {first("something")}</p>')[0];

    var pet = {
      first: function(){
        return 'Loki'
      }
    };

    reactive(el, pet);
    assert('first: Loki' == el.textContent);
  })

  it('should support complex expressions', function(){
    var el = domify('<p>first: {@siblings[0]}, last: {@siblings[@siblings.length - 1]}</p>')[0];

    var pet = {
      siblings: [
        'Loki',
        'Abby',
        'Jane'
      ]
    };

    Emitter(pet);

    reactive(el, pet);
    assert('first: Loki, last: Jane' == el.textContent);

    pet.siblings = ['Loki', 'Abby'];
    pet.emit('change siblings');

    assert('first: Loki, last: Abby' == el.textContent);
  })

  it('should support the root element', function(){
    var el = domify('<p>Hello {name}</a>')[0];
    var user = { name: 'Tobi' };
    reactive(el, user);
    assert('Hello Tobi' == el.textContent);
  })
})
