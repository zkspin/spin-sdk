OUT_NAME=gameplay

build:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	# Append the JS import helper to the front of the generated JS file
	cat misc/wasm_import_template.js > temp.js && tail -n +2 pkg/$(OUT_NAME).js >> temp.js && mv temp.js pkg/$(OUT_NAME).js
	cd js/spin && npm install && npm run build

clean:
	rm -rf pkg


## TODO: move this to npx spin