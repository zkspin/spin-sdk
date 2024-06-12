# spin-sdk

SDK for developing on-chain ZK proved application.

## Installation

Install Rust
https://www.rust-lang.org/tools/install


`npm install -g github:m4-team/zk-sdk#hackathon`

## Setup

Fill in `.env` with example in `example.env` in under 3 places:

`frontend/.env` following `frontend/template.env`
`gameplay/provable_game_logic/.env` following `gameplay/provable_game_logic/template.env`
`onchain/.env` following `onchain/template.env`

## Start a new project

This will create a scaffold for you to work on.

`npx spin init <required:project_name>`

It includes 3 components:

-   A frontend example, a simple grid walking game.
-   Solidity contract example, works together with the grid walking game.
-   ZK Provable logic written in Rust

## Test Gameplay Logic

```
cd gameplay
cargo run
```

## Build WASM Image

Note: make sure you filled in `.env` first.

Build a WASM image, including a local NPM Javascript package.

#### Build using spin

```shell
npx spin build-image (TODO: not implemented)
```

#### Build manually

```shell
cd gameplay/provable_game_logic
cargo build
make build
cd js/spin
npm install
npm run build
```

## Dry-Run WASM Image

Note: make sure you filled in `.env` first.

#### Dry-Run using spin

```shell
npx spin dry-run-image (TODO: not implemented)
```

#### Dry-Run manually

```shell
cd gameplay/provable_game_logic
make dry-run
```

## Publish WASM Image

Note: make sure you filled in `.env` first.

#### Publish using spin

```shell
npx spin publish-image (TODO: not implemented)
```

#### Publish manually

```shell
cd gameplay/provable_game_logic
make publish
```

This will return you an Image MD5 hash. Save this.

# Hardhat Integrations for Smart Contract Development

Note: make sure you filled in `.env` first.

Setup

```shell
cd onchain
npm install
```

## Test Contracts

```shell
cd onchain
npm run test
```

## Deploy Contracts

```shell
cd onchain
npm run deploy
```

## Force New Deploy Contracts

```shell
cd onchain
npm run deploy-reset
```

# Example Frontend

See README.md inside `sdk/frontend`

---

# [Below For Developers of the SDK]

1. zk-circuits
2. frontend using React for UI display
3. on-chain contracts for storing final game statesd

## Setup

Each component has its own README.md under each folder. Follow the setups there.


## Build

`npm run build`

## Testing NPX Commands Locally

#### Install the packge outside the zk-sdk directory

`npm i -g ../<path to zk-sdk>`

#### Build the package after every change

`npm run build`

#### [troubleshooting]

`npm -g uninstall spin`



**Your feedback is more than welcomed!**   

Please feel free to submit issues or send your feedback to spin-sdk@m4.team

