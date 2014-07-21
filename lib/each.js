// 'each' binding
module.exports = function(el, val) {
    var self = this;

    // get the reactive constructor from the current reactive instance
    // TODO(shtylman) port over adapter and bindings from instance?
    var Reactive = self.reactive.constructor;

    var val = val.split(/ +/);
    el.removeAttribute('each');

    var name = val[0];
    var prop = val[0];

    if (val.length > 1) {
        name = val[0];
        prop = val[2];
    }

    var parent = el.parentNode;

    // use text node to hold where end of list should be
    var placeholder = document.createTextNode('');
    parent.insertBefore(placeholder, el);
    parent.removeChild(el);

    // the reactive views we created for our array
    // one per array item
    // the length of this MUST always match the length of the 'arr'
    // and mutates with 'arr'
    var views = [];

    function childView(el, model) {
        return Reactive(el, model, {
            delegate: self.view,
            adapter: self.reactive.opt.adapter,
            bindings: self.reactive.bindings
        });
    }

    var array;

    // bind entire new array
    function change(arr) {
        // remove any old bindings/views
        views.forEach(function(view) {
            view.destroy();
        });
        views = [];

        // remove any old array observers
        if (array) {
            unpatchArray(array);
        }
        patchArray(arr);
        array = arr;

        // handle initial array
        var fragment = document.createDocumentFragment();
        arr.forEach(function(obj) {
            var clone = el.cloneNode(true);
            var view = childView(clone, obj);
            views.push(view);
            fragment.appendChild(clone);
        });
        parent.insertBefore(fragment, placeholder);
    }

    function unpatchArray(arr) {
        delete arr.splice;
        delete arr.push;
        delete arr.unshift;
    }

    function patchArray(arr) {
        // splice will replace the current arr.splice function
        // so that we can intercept modifications
        var old_splice = arr.splice;
        // idx -> index to start operation
        // how many -> elements to remove
        // ... elements to insert
        // return removed elements
        var splice = function(idx, how_many) {
            var args = Array.prototype.slice.apply(arguments);

            // new items to insert if any
            var new_items = args.slice(2);

            var place = placeholder;
            if (idx < views.length) {
                place = views[idx].el;
            }

            // make views for these items
            var new_views = new_items.map(function(item) {
                var clone = el.cloneNode(true);
                return childView(clone, item);
            });

            var splice_args = [idx, how_many].concat(new_views);

            var removed = views.splice.apply(views, splice_args);

            var frag = document.createDocumentFragment();
            // insert into appropriate place
            // first removed item is where to insert
            new_views.forEach(function(view) {
                frag.appendChild(view.el);
            });

            // insert before a specific location
            // the location is defined by the element at idx
            parent.insertBefore(frag, place);

            // remove after since we may need the element for 'placement'
            // of the new document fragment
            removed.forEach(function(view) {
                view.destroy();
            });

            var ret = old_splice.apply(arr, args);

            // set the length property of the array
            // so that any listeners can pick up on it
            self.reactive.set(prop + '.length', arr.length);
            return ret;
        };

        /// existing methods can be implemented via splice

        var push = function(el1, el2) {
            var args = Array.prototype.slice.apply(arguments);
            var len = arr.length;

            var splice_args = [len, 0].concat(args)
            splice.apply(arr, splice_args);
            return arr.length;
        };

        var unshift = function(el1, el2) {
            var args = Array.prototype.slice.apply(arguments);
            var len = arr.length;

            var splice_args = [0, 0].concat(args)
            splice.apply(arr, splice_args);
            return arr.length;
        };

        var pop = function() {
            if (!arr.length) {
                return void 0;
            }
            var element = arr[arr.length-1];
            splice.apply(arr,[arr.length-1,1]);
            return element;
        };

        var shift = function() {
            if (!arr.length) {
                return void 0;
            }
            var element = arr[0];
            splice.apply(arr,[0,1]);
            return element;
        };

        var sort = function () {
            var ret = Array.prototype.sort.apply(arr,arguments);
            var arr2 = [0,arr.length].concat(arr);
            splice.apply(arr,arr2);
            return ret;
        };

        var reverse = function() {
            var ret = Array.prototype.reverse.apply(arr);
            var arr2 = [0,arr.length].concat(arr);
            splice.apply(arr,arr2);
            return ret;
        };

        // use defineProperty to avoid making ownProperty fields
        function set_prop(prop, fn) {
            Object.defineProperty(arr, prop, {
                enumerable: false,
                writable: true,
                configurable: true,
                value: fn
            });
        }

        set_prop('splice', splice);
        set_prop('push', push);
        set_prop('unshift', unshift);
        set_prop('pop', pop);
        set_prop('shift', shift);
        set_prop('sort', sort);
        set_prop('reverse', reverse);
    }

    change(self.reactive.get(prop) || []);
    self.skip = true;

    self.reactive.sub(prop, change);
};

