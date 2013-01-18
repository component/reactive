
build: components lib/index.js lib/bindings.js lib/binding.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean
