
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

## License

  MIT
