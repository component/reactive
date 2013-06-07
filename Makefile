
SRC = $(wildcard lib/*.js)

reactive.js: components
	@component build --standalone reactive --name reactive --out .

build: components $(SRC)
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean reactive.js
