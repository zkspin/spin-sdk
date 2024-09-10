# Test

## 1. Test local Rust gameplay

test-rust:
	@cd gameplay/testing_cli && cargo run

## 2. Test image dry run

build-image:
	@npm exec -- zkspin build-image gameplay/provable_game_logic/


publish-image:
	@npm exec -- zkspin publish-image gameplay/provable_game_logic/

dry-run:
	@npm exec -- zkspin dry-run ./gameplay/provable_game_logic ../../g2/zkwasm/target/debug/zkwasm-cli --initial 0,0 --action 1,0,1,1,1

## 3. Node.js end-to-end test
### simulate gamelogic inside Node.js
### Submit transactions and verify them on-chain

test-node:
	@ts-node client-examples/nodejs/simulate_game.ts

test-transaction-onchain:
	@ts-node client-examples/nodejs/transaction_onchain.ts

## 4. Browser based end-to-end test