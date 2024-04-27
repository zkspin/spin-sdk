JSFOLDER:=../../frontend/src/app/lib/gameplay-wasm
OUT_NAME=gameplay

dry-run:
	wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	sh dry-run.sh

build-only:
	wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	# Append the JS import helper to the front of the generated JS file
	cat misc/wasm_import_template.js > temp.js && tail -n +2 pkg/$(OUT_NAME).js >> temp.js && mv temp.js pkg/$(OUT_NAME).js

build:
	wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	cp pkg/* $(JSFOLDER)/

publish:
	wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
	# Append the JS import helper to the front of the generated JS file
	cat misc/wasm_import_template.js > temp.js && tail -n +2 pkg/$(OUT_NAME).js >> temp.js && mv temp.js pkg/$(OUT_NAME).js
	node ../../../zkWasm-service-cli/dist/index.js addimage -r "https://rpc.zkwasmhub.com:8090" -p "./pkg/gameplay_bg.wasm" -u "0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde" -x "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a" -d "Lg4" -c 22

clean:
	rm -rf pkg
	rm -rf $(JSFOLDER)/$(OUT_NAME).d.ts
	rm -rf $(JSFOLDER)/$(OUT_NAME).wasm_bg.js
