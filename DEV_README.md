# For Developers of the SDK

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

## Testing

Testing the SDK and SDK itself should be separate.

Tests located in `tests/` folder.

### Unit testing process

... TODO

### Integration testing process

1. Use npx spin to install the package locally.
2. Copy over test specific files
3. Run spin end-to-end

`cd tests/integration`

Build image `npm run build`

Run local spin `npm exec -- spin ...`
