# On-Chain Contract Using Hardhat

This is the on-chain part, including the smart-contracts.

## Setups

Setup `.env` following example from `template.env`

```
npm i
```

## Test Contracts

Test are under test/

```
make test-contracts
```

## Deploy Contracts

To test deploying contracts, however, since we already deployed the contracts and hardhat keeps track of them, this should not do anything.

```shell
make deploy-contracts
```

To deploy your own contracts, run hardhat with reset so that it clears our deployment history

```shell
make deploy-contracts-reset
```
