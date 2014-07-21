# 1.2.0 (2014-07-20)

  * Added [].shift,[].pop,[].sort,[].reverse
  * Add data-selected to toggle selected state in <options>
  * fix for nested property parent subscriptions

# 1.1.1 / 2014-05-13

  * fix `data-value` binding for INPUT and TEXTAREA

# 1.1.0 / 2014-03-27

  * subscribe to parent prop changes for Reactive#sub('parent.child');
  * unpatch old array when changing arrays
  * add `bindings`` option to constructor

# 1.0.1 / 2014-03-06

  * add mouseenter, mouseleave, scroll bindings

# 1.0.0 / 2014-03-05

  * contain adapter within an Adapter class to allow per-instance adapters
  * remove change event binding from Adapter (leave to custom adapters)
  * remove formatting support (bindings are a better alternative)
  * remove explicit model method calls and view method calls in interpolation bindings
  * remove global `bindings` and `use`. Set on instances instead
  * add `Reactive#destroy` method to facilitate destroying the view and unbinding handlers
  * add `each` binding for iteration support
  * change event bindings to automatically `preventDefault`
  * remove computed properties
  * view properties are no longer supported, only view functions
  * model methods and properties take precedence over delegates

# 0.14.1 / 2014-01-09

  * fix binding to replace and update last

# 0.13.2 / 2013-08-21

  * add support for root-level bindings
  * add 'browser' field to package.json
  * update classes-component to latest version
  * support document fragments

# 0.13.1 / 2013-07-31

  * add submit event

# 0.13.0 / 2013-07-01

  * add backbone example
  * add get/set support to adapters
  * add ./reactive.js stand-alone build
  * fix interpolation for model methods
  * fix IE8 support

# 0.12.2 / 2013-05-27

  * add missing files to package.json

# 0.12.1 / 2013-05-27

  * add attribute and text interpolation support. Closes #45
  * add props-component to package.json
  * add Object.observe() example
  * add dblclick binding
  * pin deps
  * remove the need for @. Closes #47

# 0.12.0 / 2013-05-11

  * add data-class support

# 0.11.0 / 2013-04-15

  * add interpolation reactivity support

# 0.10.1 / 2013-04-11

  * use component/query instead of querySelectorAll

# 0.10.0 / 2013-02-25

  * add computed properties support

# 0.9.0 / 2013-01-17

  * add data-append
  * add data-replace
  * add data-html

# 0.8.0 / 2013-01-16

  * add interpolation

# 0.7.1 / 2012-12-28

  * fix 'formatter' property names for change listener.
  * Update main script path in package.json

# 0.7.0 / 2012-12-19

  * add subscription adapter support

# 0.6.1 / 2012-12-19

  * fix classes() reference

# 0.6.0 / 2012-12-18

  * rewrite to facilitate additional flexibility for bindings

# 0.5.0 2012-12-18

  * add mouseup / mousedown
  * add getter-style function support
  * fix form example
  * fix checkbox example

# 0.4.0 / 2012-12-13

  * add basic event support
  * add tests

# 0.3.0 / 2012-12-12

  * add better format parsing implementation
  * add format support to fabricated values

# 0.2.2 / 2012-12-12

  * remove implicit bindings for now

# 0.2.1 / 2012-12-12

  * add debug() calls

# 0.2.0 / 2012-12-12

  * add formatter support
  * add data-checked
  * add data-text
  * add data-ATTR
  * add implicit binding support via [class] / [name]

# 0.1.0 / 2012-12-12

  * add [data-hide] support
  * add [data-show] support
