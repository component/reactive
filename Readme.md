
# reactive

  Reactive template engine similar to [Rivets](http://rivetsjs.com/) minus the coffee script,
  and Caustic which no longer exists.

## Installation

    $ component install component/reactive

## Example

  Simply invoke `reactive()` on the element to wish to
  become the "template" for `obj`. The given `obj` _must_
  emit `"change"` events passing `(prop, val)`, the template
  will react to these changes.

```js
var reactive = require('reactive');
reactive(el, obj);
```

  You may also map custom callbacks for formatting or messing with an element
  based on a change. The element, value, and object itself are passed as arguments.

```js
var reactive = require('reactive');
reactive(el, user, {
  birthdate: function(el, date, user){
    el.textContent = date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
  }
});
```

  Typically the callbacks would be a reference to the view itself, for example:

```js
function ItemView(item) {
  this.item = item;
  this.el = tmpl.cloneNode(true);
  reactive(this.el, item, this);
}

ItemView.prototype = {
  filename: function(link, url){
    link.href = url;
    link.textContent = 'Download';
  },
  
  hasDownloads: function(){
    return !! this.item.filename;
  }
};
```

## Todo

  - composition of smaller templates instead of conditionals etc..
  - defer `.render()` and use `.change('birthdate', fn)` instead of object-literal
  - moar docs / examples

## License

  MIT
