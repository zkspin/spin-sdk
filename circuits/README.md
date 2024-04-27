# ZK Game Circuits

This is written with zkWams's Rust framework.

## Setup

Install Rust

https://www.rust-lang.org/tools/install

## Running Debug Terminal Session

```
cd terminal_interface
cargo run
```

## Build Wasm File

```
cd game_logic
make build
```

The output wasm package is located under pkg/

## Dry-Run the Image

```
cd game_logic
make dry-run
```

## Publish Image to Cloud Prover

Fill in `game_logic/.env` with example from `template.env`

```
cd game_logic
make publish
```
