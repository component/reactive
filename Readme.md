# reactive

  Reactive template engine for robust real-time rendering of model data changes.

## Installation

 With component:

    $ component install component/reactive

 With the stand-alone browser build:

    <script src="reactive.js"></script>

## API

`reactive` returns a function that can be used to bind DOM elements, models and views together.

```js
var reactive = require('reactive');
var bind = reactive();
bind(el, model);
```

This is often called in a single line:

```js
var reactive = require('reactive')();
```

### bind(element, object, [view])

  Bind `object` to the given `element` with optional `view` object. When a `view` object is present it will be checked first for overrides, which otherwise delegate to the model `object`.

The `bind` function takes 3 parameters: `el`, `model`, `view`.

`el` is any DOM node and is required. The `model` is a simple object of data that emits `change` events. The `view` is an optional parameter that allows you to add an additional object that handles any business logic that doesn't belong in a model. 

Each `bind` function returned by `reactive` is self-contained, so you can safely share your reactive bindings across an application or within your library.

### .use(fn)

You can add extra functionality to reactive via the `use` method:

```js
bind.use(plugin);
```

This method takes a function that is passed the reactive instance. Here is an example that will add an additional `autosubmit` binding:

```
function plugin(reactive) {
  reactive.bind('autosubmit', function(){
    // do something
  });
}
```

The `use` method can also be chained:

```js
bind
  .use(filters)
  .use(bindings)
  .use(plugin);
```

## Example 

For example if you have the following HTML:

```html
<h1 data-text="name"></h1>
```

And pass the following `object` as the _second_ argument:

```js
var reactive = require('reactive');
var bind = reactive();

bind(el, {
  name: 'Tobi'
});

```

The output will become:

```html
<h1>Tobi</h1>
```

However if you wish to manipulate the output or provided computed properties thae `view` object may be passed. For example an `object` of:

```js

function UserView(user) {
  this.user = user;
}

UserView.prototype.name = function(){
  return this.user.first_name + ' ' + this.user.last_name;
}

var user = new UserView({
  first_name: "Tobi",
  last_name: "Ferret"
});

bind(el, {}, user);
```

Would produce:

```html
<h1>Tobi Ferret</h1>
```

Typically a view object wraps a model to provide additional functionality, this may look something like the following:

```js
function UserView(user) {
  this.user = user;
  this.el = reactive(tmpl, user, this);
}

UserView.prototype.name = function(){ ... }
```

Often a higher-level API is built on top of this pattern to keep things DRY but this is left to your application / other libraries.

## Adapters

### Subscriptions

 Subscriptions allow reactive to know when an object's data has changed updating the DOM appropriately _without_ re-rendering a static template. This means if you make manual DOM adjustments, append canvases etc they will remain intact.

  By default reactive subscribes using `.on("change <name>", callback)` however it's easy to define your own subscription methods:

```js
bind.subscribe(function(obj, prop, fn){
  obj.bind(prop, fn);
});

bind.unsubscribe(function(obj, prop, fn){
  obj.unbind(prop, fn);
});
```

### Getting and Setting

You can make reactive compatible with your favorite framework by defining how reactive gets and sets the model.

By default reactive supports `obj[prop] = val`, `obj.get(prop)` and `obj[prop](val)`, but these can be changed with `reactive.get(fn)` and `reactive.set(fn)`. Here's how to make reactive compatible with backbone:

```js
bind.get(function(obj, prop) {
  return obj.get(prop);
});

bind.set(function(obj, prop, val) {
  obj.set(prop, val);
});
```

## Interpolation

  Bindings may be applied via interoplation on attributes or text. For example here
  is a simple use of this feature to react to changes of an article's `.name` property:

```html
<article>
  <h2>{name}</h2>
</article>
```

  Text interpolation may appear anywhere within the copy, and may contain complex JavaScript expressions
  for defaulting values or other operations.

```html
<article>
  <h2>{ name || 'Untitled' }</h2>
  <p>Summary: { body.slice(0, 10) }</p>
</article>
```

 Reactive is smart enough to pick out multiple properties that may be used, and
 react to any of their changes:

```html
<p>Welcome { first + ' ' + last }.</p>
```

 Interpolation works for attributes as well, reacting to changes as you'd expect:

```html
<li class="file-{id}">
  <h3>{filename}</h3>
  <p><a href="/files/{id}/download">Download {filename}</a></p>
<li>
```

## Declarative Bindings

  By default reactive supplies bindings for setting properties, listening to events, toggling visibility, appending and replacing elements. Most of these start with "data-*" however this is not required.

### data-text

The `data-text` binding sets the text content of an element.

### data-html

The `data-html` binding sets the inner html of an element.

### data-&lt;attr&gt;

The `data-<attr>` bindings allows you to set an attribute:

```html
<a data-href="download_url">Download</a>
```

### on-&lt;event&gt;

The `on-<event>` bindings allow you to listen on an event:

```html
<li data-text="title"><a on-click="remove">x</a></li>
```

### data-append

  The `data-append` binding allows you to append an existing element:

```html
<div class="photo" data-append="histogram">

</div>
```

### data-replace

  The `data-replace` binding allows you to replace an existing element, and carryover its attributes:

```html
<div class="photo" data-replace="histogram"></div>
```

### data-{visible,hidden}

  The `data-visible` and `data-hidden` bindings conditionally add "visible" or "hidden" classnames so that you may style an element as hidden or visible.

```html
<p data-visible="hasDescription" data-text="truncatedDescription"></p>
```

### data-checked

 Toggles checkbox state:

```html
<input type="checkbox" data-checked="agreed_to_terms">
```

### Writing bindings

To author bindings simply call the `reactive.bind(name, fn)` method, passing the binding name and a callback which is invoked with the element itself and the value. For example here is a binding which removes an element when truthy:

```js
bind.bind('remove-if', function(el, name){
  el = $(el);
  var parent = el.parent();
  this.change(function(){
    if (this.value(name)) {
      el.remove();
    }
  });
});
```

## Computed properties

Reactive supports computed properties denoted with the `<` character. Here the `fullname` property does not exist on the model, it is a combination of both `.first` and `.last`, however you must tell Reactive about the real properties in order for it to react appropriately:

```html
<h1 data-text="fullname < first last"></h1>
```

__NOTE__: in the future Reactive may support hinting of computed properties from _outside_ Reactive itself, as your ORM-ish library may already have this information.

## Interpolation

 Some bindings such as `data-text` and `data-<attr>` support interpolation. These properties are automatically added to the subscription, and react to changes:


 ```html
 <a data-href="/download/{id}" data-text="Download {filename}"></a>
 ```

## Notes

  Get creative! There's a lot of application-specific logic that can be converted to declarative Reactive bindings. For example here's a naive "auto-submit" form binding:

```html
<div class="login">
  <form action="/user" method="post" autosubmit>
    <input type="text" name="name" placeholder="Username" />
    <input type="password" name="pass" placeholder="Password" />
    <input type="submit" value="Login" />
  </form>
</div>
```

```js
var reactive = require('reactive')();

// custom binding available to this view only

reactive.bind('autosubmit', function(el){
  el.onsubmit = function(e){
    e.preventDefault();
    var path = el.getAttribute('action');
    var method = el.getAttribute('method').toUpperCase();
    console.log('submit to %s %s', method, path);
  }
});

// bind

var view = reactive(document.querySelector('.login'));

```

For more examples view the ./examples directory.

## License

  MIT
