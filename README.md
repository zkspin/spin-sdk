# zk-sdk

SDK for developing on-chain ZK proved application.

## Installation

Install Rust
https://www.rust-lang.org/tools/install

`npm install -g github:m4-team/zk-sdk#hackathon`

## Start a new project

This will create a scaffold for you to work on.

`npx spin init <optional:project_name>`

## Overview

There are two components to this app worflow:

1. zk-circuits powered by zkWasm
2. frontend using React for UI display
3. on-chain contracts for storing final game states

# Features

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
