
var reactive = require('reactive')();
var Emitter = require('emitter');
var domify = require('domify');
var assert = require('assert');

function User(first, last) {
  this.first = first;
  this.last = last;
}

Emitter(User.prototype);

User.prototype.fullname = function(){
  return this.first + ' ' + this.last;
};

User.prototype.removed = function(){
  return !! this.removed_at;
};

var user = new User('Tobi', 'Ferret');

describe('computed properties', function(){
  it('should work with multiple properties', function(){
    var el = domify('<p><em data-text="fullname < first last"></em></p>');
    var user = new User('Tobi', 'Ferret');
    var view = reactive(el, user);
    var em = el.children[0];

    assert('Tobi Ferret' == em.textContent);
  })

  it('should react to changes', function(){
    var el = domify('<p><em data-text="fullname < first last"></em></p>');
    var user = new User('Tobi', 'Ferret');
    var view = reactive(el, user);
    var em = el.children[0];

    assert('Tobi Ferret' == em.textContent);

    user.first = 'Loki';
    user.emit('change first');
    assert('Loki Ferret' == em.textContent);

    user.last = 'Holowaychuk';
    user.emit('change last');
    assert('Loki Holowaychuk' == em.textContent);
  })

  it('should work with .value() only', function(){
    var el = domify('<p><em data-hidden="removed < removed_at"></em></p>');
    var user = new User('Tobi', 'Ferret');
    var view = reactive(el, user);
    var em = el.children[0];

    assert('visible' == em.className);

    user.removed_at = new Date;
    user.emit('change removed_at');
    assert('hidden' == em.className);
  })
})
