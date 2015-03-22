examples: examples/reactive.js
examples/reactive.js: components
	npm run component-build -- --out examples --name reactive

components: component.json
	npm run component-install -- --dev

clean:
	rm -fr build components test/reactive.js test/build*

test-assets: components
	npm run component-build -- --dev --out test/build

test-local: test-assets
	open test/index.html

test-karma: test-assets
	node_modules/.bin/karma start --single-run

.PHONY: clean test
