JSFOLDER:=../../frontend/src/app/lib/gameplay-wasm

dry-run:
	wasm-pack build --release --out-name gameplay --target web --out-dir pkg
	sh dry-run.sh

build-only:
	wasm-pack build --release --out-name gameplay --target web --out-dir pkg

build:
	wasm-pack build --release --out-name gameplay --target web --out-dir pkg
	cp pkg/* $(JSFOLDER)/

publish:
	wasm-pack build --release --out-name gameplay --target web --out-dir pkg
	node ../../../zkWasm-service-cli/dist/index.js addimage -r "https://rpc.zkwasmhub.com:8090" -p "./pkg/gameplay_bg.wasm" -u "0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde" -x "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a" -d "Lg4" -c 22

clean:
	rm -rf pkg
	rm -rf $(JSFOLDER)/gameplay.d.ts
	rm -rf $(JSFOLDER)/gameplay.wasm_bg.js
