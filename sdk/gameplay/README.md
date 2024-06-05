# ZK Game Circuits

This is written with zkWams's Rust framework.

## Setup

Install Rust

https://www.rust-lang.org/tools/install

## Running Debug Terminal Session

```
cd testing_cli
cargo run
```

## Build Wasm File

```
cd provable_game_logic
make build
```

The output wasm package is located under pkg/

## Dry-Run the Image

```
cd provable_game_logic
make dry-run
```

## [optional] Publish Image to Cloud Prover

Fill in `provable_game_logic/.env` with example from `template.env`

```
cd provable_game_logic
make publish
```
