
# reactive

  Reactive template engine

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

## Todo

  - composition of smaller templates instead of conditionals etc..
  - moar docs / examples

## License

  MIT
