# Test

## 1. Test local Rust gameplay

test-rust:
	@cd gameplay/testing_cli && cargo run

## 2. Test image dry run

build-image:
	@npm exec -- zkspin build-image --path gameplay/provable_game_logic/


publish-image:
	@npm exec -- zkspin publish-image --path gameplay/provable_game_logic/

dry-run:
	@npm exec -- zkspin dry-run --path gameplay/provable_game_logic/ --public 0 --private 0