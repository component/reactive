
var reactive = require('reactive');
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
    var el = domify('<p><em data-text="fullname < first last"></em></p>')[0];
    var user = new User('Tobi', 'Ferret');
    var view = reactive(el, user);
    var em = el.children[0];

    assert('Tobi Ferret' == em.textContent);
  })

  it('should react to changes', function(){
    var el = domify('<p><em data-text="fullname < first last"></em></p>')[0];
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
    var el = domify('<p><em data-hide="removed < removed_at"></em></p>')[0];
    var user = new User('Tobi', 'Ferret');
    var view = reactive(el, user);
    var em = el.children[0];

    assert('show' == em.className);

    user.removed_at = new Date;
    user.emit('change removed_at');
    assert('hide' == em.className);
  })

  it('should track dependencies', function(){
    var el = domify('<p><em data-hide="removed < removed_at"></em></p>')[0];
    var user = new User('Tobi', 'Ferret');
    var view = reactive(el, user);
    var binding = view.bindings['data-hide'][0];
    assert(2 == binding.deps.length);
    assert('removed,removed_at' == binding.deps.join(','));
  })
})
