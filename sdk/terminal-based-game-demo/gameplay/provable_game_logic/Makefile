include .env
export
OUT_NAME=gameplay

build:
	@cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	# Append the JS import helper to the front of the generated JS file
	cat misc/wasm_import_template.js > temp.js && tail -n +2 pkg/$(OUT_NAME).js >> temp.js && mv temp.js pkg/$(OUT_NAME).js
	cd js/spin && npm install && npm run build

publish: build
	# node ../../../../zkWasm-service-cli/dist/index.js addimage -r ${ZK_CLOUD_URL} -p "./pkg/gameplay_bg.wasm" -u "${ZK_CLOUD_USER_ADDRESS}" -x "${ZK_CLOUD_USER_PRIVATE_KEY}" -d "Lg4" -c 22
	node /Users/andyjiang/spin/spin-sdk-testing/zkWasm-service-cli/dist/index.js addimage -r ${ZK_CLOUD_URL} -p "./pkg/gameplay_bg.wasm" -u "${ZK_CLOUD_USER_ADDRESS}" -x "${ZK_CLOUD_USER_PRIVATE_KEY}" -d "Lg4" -c 22

clean:
	rm -rf pkg


## TODO: move this to npx spin