examples: examples/reactive.js
examples/reactive.js: components
	npm run component-build -- --out examples --name reactive

components: component.json
	npm run component-install -- --dev

clean:
	rm -fr build components test/reactive.js test/build*

test: components
	npm run component-build -- --dev --out test/build
	open test/index.html

.PHONY: clean test
