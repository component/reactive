# reactive [![Build Status](https://travis-ci.org/component/reactive.svg?branch=master)](https://travis-ci.org/component/reactive)

 Simple and Flexible template and view binding engine with support for custom bindings and real-time updates on model changes.

## Installation

With component:
```
$ component install component/reactive
```

With npm via [browserify](http://browserify.org/):
```
$ npm install reactive
```

## Quickstart

Rendering a basic html template with a predefined data model.

```js
var view = reactive('<p>Hello {name}!</p>', {
  name: 'Adam'
});

// you can add the view "element" to the html whenever you want
// view.el contains the html element
document.body.appendChild(view.el);
```

```html
<p>Hello Adam!</p>
```

### Handling events

Reactive provides an easy way to register handlers for dom events via predefined "bindings".

```js
var handlers = {
  clickme: function(ev) {
    // console.log('button clicked');
  }
};

var template = '<button on-click="clickme">clickme</button>';
var view = reactive(template, {}, {
  delegate: handlers
});
```

A recommended approach is to wrap the `reactive` instance inside of your own *View* classes. See the [Views]() example.

### Iteration

Iteration is achieved by using the `each` binding on the element you wish to iterate.

```js
var template = '<ul><li each="people">{this}</li></ul>';
var model = {
  people: ['Sally', 'Billy']
};

var view = reactive(template, model);
```

```html
<ul>
  <li>Sally</li>
  <li>Billy</li>
</ul>
```

You can push (pop, shift, etc) to the array and the view will be updated accordingly.
```js
model.people.push('Eve');
```

```html
<ul>
  <li>Sally</li>
  <li>Billy</li>
  <li>Eve</li>
</ul>
```

### Hiding and showing elements

DOM elements can be shown or hidden via the `data-visible` and `data-hidden` bindings.

Using the following html template.

```js
var tmpl = '<p data-hidden="items.length">no items</p>' +
  '<ul data-visible="items.length"><li each="items">{this}</li></ul>';
var model = { items: [] };
var view = reactive(tmpl, model);
```

When rendering the above, we will see `no items`, because the array is empty.

```js
model.items.push('one');
```

Will change the output to `· one` and hide `no items`. Notice how `data-visible` and `data-hidden` act in opposite directions.


## API

### reactive(string | element, model, [options])

Create a new reactive instance using `string` or `element` as the template and `model` as the data object. This binds a DOM element to a model.

If you do not have a data model and want to specify options, you can pass `null` or `{}`. Remember you **must** have this argument before the options argument.

Options

| option | type | description |
| --- | --- | --- |
| delegate | object, instance | an object or instance defining overrides and handlers for properties and events |
| adapter | function | defines how reactive will interact with the model to listen for changes |
| bindings | object | define custom bindings (see bindings docs below) |

Bind `object` to the given `element` with optional `view` object. When a `view` object is present it will be checked first for overrides, which otherwise delegate to the model `object`.

### set(prop, val)

Set the property `prop` to the given value `val` in the view.

### set({prop: val})

Set multiple properties `prop` and given values `val` in the view.

### get(prop)

Get the value for property `prop`.

### bind(name, fn)

> Recommend using `bindings` option during construction instead. Will be removed in the future.

Create a new binding called `name` defined by `fn`. See the [writing bindings](#writing-bindings) section for details.

### use(fn)

Use a reactive plugin. `fn` is invoked immediately and passed the reactive instance.

### destroy()

Destroy the reactive instance. This will remove all event listeners on the instance as well as remove the element from the dom.

Fires a `destroyed` event upon completion.

## Model Adapters

Model Adapters provide the interface for reactive to interact with your model implementation. By using a custom adapter you can support models from [backbone.js](http://backbonejs.org/#Model), [modella](https://github.com/modella/modella), [bamboo](https://github.com/defunctzombie/bamboo), etc..

You can make reactive compatible with your favorite model layer by creating a custom adapter. Changes to your model will cause the reactive view to update dynamically. The following API is required for all adapters.

### constructor

The `adapter` option is a function which accepts one argument, the `model` and should return an instance with all of the adapter methods implemented. *The constructor will be called as a function - without the `new` keyword.*

As an example, the builtin adapter's constructor is:

```js
function Adapter(model) {
  if (!(this instanceof Adapter)) {
    return new Adapter(model);
  }

  var self = this;
  self.model = model;
};
```

In addition to the constructor, the adapter must implement these methods:

* subscribe
* unsubscribe
* unsubscribeAll
* set
* get

### subscribe(prop, fn)

Subscribe to changes for the given property. When the property changes, `fn` should be called.

```js
Adapter.prototype.subscribe = function(prop, fn) { ... };
```

### unsubscribe(prop, fn)

Unsubscribe from changes for the given property. The `fn` should no longer be called on property changes for `prop`.

### unsubscribeAll

Unsubscribe all property change events. Used when a reactive instance is being torn down.

### set(prop, val)

Set the property `prop` to the given value `val`.

### get(prop)

Get the value for property `prop`

### Stock Adapters

* [reactive-bamboo](https://github.com/defunctzombie/reactive-bamboo) - an adapter for [bamboo](https://github.com/defunctzombie/bamboo).
* [reactive-backbone](https://github.com/airportyh/reactive-backbone) - an adapter for Backbone models.

## Plugins

Custom bindings to extend reactive are listed on the [plugins wiki page](https://github.com/component/reactive/wiki#plugins)


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

### each

The `each` binding allows you to iterate a collection of objects within the model:

```html
<ul>
  <li each="children">{name}</li>
</ul>
```

The model is expected to have a `children` property whose value is an array.

### on-&lt;event&gt;

The `on-<event>` bindings allow you to listen on an event:

```html
<li data-text="title"><a on-click="remove">x</a></li>
```

`remove` is expected to be a method on the specified `delegate` object:

```js
var delegate = {
  remove: function(ev) {
    console.log('Removing thing!');
    ...
  }
}

reactive(template, model, {
  delegate: delegate
});
```

### data-append

  The `data-append` binding allows you to append an existing element:

```html
<div class="photo" data-append="histogram"></div>
```

The `histogram` property on the model is expected to contain a DOM element.

### data-replace

  The `data-replace` binding allows you to replace an existing element, and carryover its attributes:

```html
<div class="photo" data-replace="histogram"></div>
```

The `histogram` property on the model is expected to contain a DOM element.

### data-{visible,hidden}

  The `data-visible` and `data-hidden` bindings conditionally add "visible" or "hidden" classnames so that you may style an element as hidden or visible.

```html
<p data-visible="hasDescription" data-text="truncatedDescription"></p>
```

`data-visible` will add a `visible` class if the property is `truthy`. For arrays, use the `.length` property to trigger on empty or non-empty arrays.

`data-hidden` is the opposite of visible and will add a `visibile` class if the value is false and `.hidden` class if the value is truthy.

### data-checked

 Toggles checkbox state:

```html
<input type="checkbox" data-checked="agreed_to_terms">
```

### data-selected

 Toggles option state:

```html
<option data-selected="selected"></option>
```

### Writing bindings

To author bindings, simply create a function that will accept two arguments, the element and binding value. For example, here is a binding which removes an element when truthy:

```js
function removeIf(el, property){
  var binding = this;
  binding.change(function() {
    if (binding.value(property)) {
      el.parentNode.removeChild(el);
    }
  });
};

var template = '<span remove-if="name">no name</span>';
var view = reactive(template, { name: 'foobar' }, {
 bindings: {
  'remove-if': removeIf
 }
});
```

Notice that you can call the binding whatever you want when you create your view allowing you to select appropriate names. Binding authors should recommend names that make sense.

Here is another binding which uses [momentjs](http://momentjs.com/) to pretty print a javascript date.

```js
var template = '<span moment="timestamp" format="MMM Do YY"></span>';
var view = reactive(template, { timestamp: new Date() }, {
 bindings: {
  'moment': momentFormat
 }
});

function momentFormat(el, property) {
  var binding = this;
  var format = el.getAttribute('format');
  binding.change(function () {
     var val = binding.value(property);
     el.innerText = moment(val).format(format);
  });
};
```

Would output the following html
```html
<span>Mar 3rd 14</span>
```

You can easily re-use such bindings by making them plugins and enabling them on your instance with `.use()`

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
var reactive = require('reactive');

var view = reactive(document.querySelector('.login'), {}, {
 bindings: {
  autosubmit: autosubmit
 }
});

function autosubmit(el){
  el.onsubmit = function(e){
    e.preventDefault();
    var path = el.getAttribute('action');
    var method = el.getAttribute('method').toUpperCase();
    console.log('submit to %s %s', method, path);
  }
};
```

## View patterns

Typically a view object wraps a model to provide additional functionality, this may look something like the following:

```js
function UserView(user) {
  this.user = user;
  this.view = reactive(tmpl, user, {
    delegate: this
  });
}

UserView.prototype.clickme = function(ev){ ... }
```

Often a higher-level API is built on top of this pattern to keep things DRY but this is left to your application / other libraries.

For more examples view the ./examples directory.

## License

  MIT
