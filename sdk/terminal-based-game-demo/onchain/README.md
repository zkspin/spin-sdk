# Spin On-chain Template

## Setups

Setup `.env` following the example from `template.env`

```
yarn
```

## Test Contracts

Test are under test/

> Test currently fails because test uses hardcoded old-dated verifier

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

## Deployment

Deployed To: 0x6DE970d7A631F45466F4DE76dd72C49b4425e4c3 Sepolia
