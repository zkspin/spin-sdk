# Introduction

This will be a guide that helps you use Spin to develop trustless provable on-chain games.

The game built using the Spin SDK will include **three components**: the provable gameplay written in Rust, the on-chain contract written in Solidity, and the frontend UI written in Javascript with React.

The Spin SDK will provide toolchains to

-   generate boilerplate for starting a new project
-   build and publish the provable Rust gameplay to the cloud proving machine
-   export gameplay to use in browser environment in form of a local NPM package
-   integrate your on-chain contract for verifying Rust gameplay

[![High Level Components](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=eVSpiKOUoeKAZNje0UowrQ&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=eVSpiKOUoeKAZNje0UowrQ)

#### Provable On-chain

Provable On-chain game here means that for any game logic that’s not on the blockchain, we can prove the execution using ZK and verify the output on-chain.

[![Provable On-Chain Game Process](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=qgrLyRuypSPWsysJtxtwuw&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=qgrLyRuypSPWsysJtxtwuw)

We know that on-chain programs are trustworthy, because they live on-chain where no one can cheat unless they can perform the 51% attack. However, how do you prove a program running on someone’s local machine is executing as expected. This is where the ZK program comes in to prove that.

#### Audience of this Guide

The audience for this guide is **technical developers** who want to build provable game but don’t want to start from the scratch of writing low-level ZK circuits and figuring out the flow building such an application end-to-end.

#### Programming Languages

There also other language of choice for each component. For example, you could use C to write the provable game logic or any other frontend language. However, we only have support for the language in **Rust** for gameplay, **Javascript** for frontend, and **Solidity** for smart contract so far. More supports are in the roadmap to be added.
