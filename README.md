# zk-sdk

SDK for developing on-chain ZK proved application.

## Installation

Install Rust
https://www.rust-lang.org/tools/install

`npm install -g github:m4-team/zk-sdk#hackathon`

## Start a new project

This will create a scaffold for you to work on.

`npx spin init <required:project_name>`

It includes 3 components:

-   A frontend example, a simple grid walking game.
-   Solidity contract example, works together with the grid walking game.
-   ZK Provable logic written in Rust

# Developing the SDK

## Setup

Each component has its own README.md under each folder. Follow the setups there.

## Build

`npm run build`

## [DEV] Testing NPX Commands Locally

#### Install the packge outside the zk-sdk directory

`npm i -g ../<path to zk-sdk>`

#### Build the package after every change

`npm run build`

#### [troubleshooting]

`npm -g uninstall spin`
