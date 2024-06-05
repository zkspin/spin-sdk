include .env
export
OUT_NAME=gameplay

build:
	wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	# Append the JS import helper to the front of the generated JS file
	cat misc/wasm_import_template.js > temp.js && tail -n +2 pkg/$(OUT_NAME).js >> temp.js && mv temp.js pkg/$(OUT_NAME).js

dry-run: build
	sh dry-run.sh


publish: build
	node ../../../zkWasm-service-cli/dist/index.js addimage -r "https://rpc.zkwasmhub.com:8090" -p "./pkg/gameplay_bg.wasm" -u "${ZK_WASM_CLOUD_USER_ADDR}" -x "${ZK_WASM_CLOUD_PRIVATE_KEY}" -d "Lg4" -c 22

clean:
	rm -rf pkg


## TODO: move this to npx spinsdk