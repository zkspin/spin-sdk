OUT_NAME=gameplay
JS_OUT_DIR=$(OUTPUT_PATH)/js

build-wasm-zk:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --out-dir $(OUTPUT_PATH)/wasm && echo "BUILD_WASM_ZK_SUCCESS"

wasm-build-web:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir $(JS_OUT_DIR)/esm
	# Append the JS import helper to the front of the generated JS file
	cat $(MISC_PATH)/wasm_import_template_esm.js > temp.js && tail -n +2  $(JS_OUT_DIR)/esm/$(OUT_NAME).js >> temp.js && mv temp.js $(JS_OUT_DIR)/esm/$(OUT_NAME).js


wasm-build-node:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target nodejs --out-dir  $(JS_OUT_DIR)/commonjs
	# Append the JS import helper to the front of the generated JS file
	cat $(MISC_PATH)/wasm_import_template_commonjs.js > temp.js && tail -n +4 $(JS_OUT_DIR)/commonjs/$(OUT_NAME).js >> temp.js && mv temp.js $(JS_OUT_DIR)/commonjs/$(OUT_NAME).js

build-spin: wasm-build-web wasm-build-node
	@echo "BUILD_SPIN_SUCCESS"

clean:
	rm -rf $(OUT_DIR)