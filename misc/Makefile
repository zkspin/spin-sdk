OUT_NAME=gameplay
OUT_DIR=$(OUTPUT_PATH)/spin

wasm-build-web:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir $(OUT_DIR)/wasm/esm
	# Append the JS import helper to the front of the generated JS file
	cat $(MISC_PATH)/wasm_import_template_esm.js > temp.js && tail -n +2  $(OUT_DIR)/wasm/esm/$(OUT_NAME).js >> temp.js && mv temp.js $(OUT_DIR)/wasm/esm/$(OUT_NAME).js


wasm-build-node:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target nodejs --out-dir  $(OUT_DIR)/wasm/commonjs
	# Append the JS import helper to the front of the generated JS file
	cat $(MISC_PATH)/wasm_import_template_commonjs.js > temp.js && tail -n +3 $(OUT_DIR)/wasm/commonjs/$(OUT_NAME).js >> temp.js && mv temp.js $(OUT_DIR)/wasm/commonjs/$(OUT_NAME).js

build: wasm-build-web wasm-build-node
	cd $(OUT_DIR) && npm install && npm run build

build-spin:
	cd $(OUT_DIR) && npm install && npm run build

clean:
	rm -rf $(OUT_DIR)