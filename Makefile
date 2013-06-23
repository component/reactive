
SRC = $(wildcard lib/*.js)

build: components $(SRC)
	@component build --dev

reactive.js: components
	@component build --standalone reactive --name reactive --out .

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

test: build
	open test/index.html

.PHONY: clean reactive.js test
