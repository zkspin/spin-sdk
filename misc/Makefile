OUT_NAME=gameplay


wasm-build-web:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir build/wasm/esm
	# Append the JS import helper to the front of the generated JS file
	cat $(MISC_PATH)/wasm_import_template_esm.js > temp.js && tail -n +2 build/wasm/esm/$(OUT_NAME).js >> temp.js && mv temp.js build/wasm/esm/$(OUT_NAME).js


wasm-build-node:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target nodejs --out-dir build/wasm/commonjs
	# Append the JS import helper to the front of the generated JS file
	cat $(MISC_PATH)/wasm_import_template_commonjs.js > temp.js && tail -n +3 build/wasm/commonjs/$(OUT_NAME).js >> temp.js && mv temp.js build/wasm/commonjs/$(OUT_NAME).js

build: wasm-build-web wasm-build-node
	cd build/js && npm install && npm run build

build-spin:
	cd build/js && npm install && npm run build

clean:
	rm -rf build/wasm

