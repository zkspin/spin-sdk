RUST_BACKTRACE=full ../../../../g2/zkwasm/target/debug/zkwasm-cli --params "./params" wasm_output setup --wasm pkg/gameplay_bg.wasm
## TODO: move this using npx spinsdk
RUST_BACKTRACE=full ../../../../g2/zkwasm/target/debug/zkwasm-cli --params "./params" wasm_output dry-run --wasm pkg/gameplay_bg.wasm --output ./output \
--public 1:i64 \
--public 1:i64 \
--private 8:i64 \
--private 1:i64 \
--private 1:i64 \
--private 1:i64 \
--private 1:i64 \
--private 1:i64 \
--private 1:i64 \
--private 1:i64 \
--private 1:i64