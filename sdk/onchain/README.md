# Spin On-chain Template

## Setups

Setup `.env` following the example from `template.env`

```
yarn
```

## Test Contracts

Test are under test/

```
yarn test
```

## Deploy Contracts

To test deploying contracts, after you have deployed the contracts, hardhat keeps track of them under /ignition/deployments

```shell
yarn deploy
```

To deploy your own contracts, run hardhat with reset so that it clears our deployment history

```shell
yarn deploy-reset
```
