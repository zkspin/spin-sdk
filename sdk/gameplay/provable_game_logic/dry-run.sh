RUST_BACKTRACE=full $1/zkwasm-cli --params "./params" wasm_output setup --wasm pkg/gameplay_bg.wasm

RUST_BACKTRACE=full $1/zkwasm-cli --params "./params" wasm_output dry-run --wasm pkg/gameplay_bg.wasm --output ./output \
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