var domify = require('domify');
var assert = require('assert');

var reactive = require('../');

describe('text interpolation', function(){
  it('should support initialization', function(){
    var el = domify('<div><a href="/download/{id}"><strong>Download</strong> {file}</a></div>');
    var user = { id: '1234', file: 'tobi.png' };
    var view = reactive(el, user);
    assert('Download tobi.png' == el.children[0].textContent);
  })

  it('should ignore whitespace', function(){
    var el = domify('<div><a href="/download/{ id }"><strong>Download</strong> { file }</a></div>');
    var user = { id: '1234', file: 'tobi.png' };
    var view = reactive(el, user);
    assert('Download tobi.png' == el.children[0].textContent);
  })

  it('should ignore null values', function(){
    var el = domify('<div>{ id }</div>');
    var user = { id: null };
    var view = reactive(el, user);
    assert('' === el.textContent);
  })

  it('should react to changes', function(){
    var el = domify('<div><a href="/download/{id}"><strong>Download</strong> {file}</a></div>');
    var user = { id: '1234', file: 'tobi.png' };

    var view = reactive(el, user);
    assert('Download tobi.png' == el.children[0].textContent);

    view.set('file', 'loki.png');
    assert('Download loki.png' == el.children[0].textContent);
  })

  it('should support multiple properties', function(){
    var el = domify('<div><p>{first} {last} is a {species}</p></div>');
    var pet = { first: 'tobi', last: 'holowaychuk', species: 'ferret' };
    var view = reactive(el, pet);
    assert('tobi holowaychuk is a ferret' == el.children[0].textContent);
  })

  it('should support multiple properties in a single expression', function(){
    var el = domify('<p>{first + " " + last}</p>');
    var pet = { first: 'tobi', last: 'holowaychuk' };

    var view = reactive(el, pet);
    assert('tobi holowaychuk' == el.textContent);

    view.set('last', 'ferret');
    assert('tobi ferret' == el.textContent);
  })

  it('should support model method calls as properties', function(){
    var el = domify('<p>first: {first}</p>');

    var pet = {
      first: function(){
        return 'Loki'
      }
    };

    reactive(el, pet);
    assert('first: Loki' == el.textContent);
  })

  it('should support complex expressions', function(){
    var el = domify('<p>first: {siblings[0]}, last: {siblings[siblings.length - 1]}</p>');

    var pet = {
      siblings: [
        'Loki',
        'Abby',
        'Jane'
      ]
    };

    var view = reactive(el, pet);
    assert('first: Loki, last: Jane' == el.textContent);

    view.set('siblings', ['Loki', 'Abby']);
    assert('first: Loki, last: Abby' == el.textContent);
  })

  it('should support complex model method calls as properties', function(){
    var el = domify('<p>name: {casual ? first : first + " " + last}</p>');

    var pet = {
      casual: function(){ return false },
      first: function(){ return 'Loki' },
      last: function(){ return 'the Pet' }
    };

    reactive(el, pet);
    assert('name: Loki the Pet' == el.textContent);
  })

  it('should support method calls as properties on the view', function(){
    var el = domify('<p>name: {casual}</p>');

    var pet = {
      casual: function(){ return false },
      first: function(){ return 'Loki' },
      last: function(){ return 'the Pet' }
    };

    var view = {
      casual: function(){ return pet.first() + ' ' + pet.last() }
    }

    reactive(el, pet, {
      delegate: view
    });

    assert.equal('name: Loki the Pet', el.textContent);
  })

  it('should support the root element', function(){
    var el = domify('<p>Hello {name}</a>');
    var user = { name: 'Tobi' };
    reactive(el, user);
    assert('Hello Tobi' == el.textContent);
  })

  it('should support calling a property as a function', function(){
    var model = { name: { first: 'Some Really Long Name' } };
    var view = reactive('<p>Hello {name.first.slice(0,6)}</p>', model);
    assert('Hello Some R' == view.el.textContent);

    var model = { name: 'Some Really Long Name' };
    var view = reactive('<p>Hello {name.slice(0,4)}</p>', model);
    assert('Hello Some' == view.el.textContent);
  })

  it('should support setting base property', function(){
    var model = { name: { first: 'foobar' } };
    var view = reactive('<p>{name.first}</p>', model);
    assert('foobar' == view.el.textContent);

    view.set('name', { first: 'baz' });
    assert('baz' == view.el.textContent);
  })
})
