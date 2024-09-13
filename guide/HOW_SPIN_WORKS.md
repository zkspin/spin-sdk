# How does Spin work

Let's say we are building a 2048 game, where we want to keep track a trust-less leaderboard permanently on-chain, while allowing players to play the game entirely on the player's own machine. That is, the actual execution of the 2048 game won't be on-chain. Yet, we'll be able to proof the correctness of playing the game when the players submit their scores on-chain. In other word, we can prove the player didn't cheat when they run their game locally.

Spin works by separating the game into **two layers**:

The **on-chain layer** where the permanent game state is kept and does relatively less computation, in the 2048 example, this would be a leaderboard kept in a smart contract on-chain.

The **off-chain layer** is where the bulk of the computation is done, it takes in player inputs and yields an output, e.g the final score of a game of 2048. The player inputs would be all the moves (up, down, left, right) the player made during playing 2048.

[![Spin Gameplay Layers](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=flLlJQleDmEvSRzrCNzeBg&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=flLlJQleDmEvSRzrCNzeBg)

Spin uses ZK to prove the off-chain part, which then get submit the proof on-chain, if you are familiar with rollup in blockchain, this is similar to how rollup chains work.

Because the off-chain gameplay is ZK proved, when it is submitted on-chain, it gains the same security guarantees as the chain it is on.

[![Rollup Process Sequence](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=Qno0cZHK41DPL9kLrv4iTw&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=Qno0cZHK41DPL9kLrv4iTw)

## The ZK Data Flow

In this section, we’ll introduce how the data flows end-to-end starting at the point when the player opens up the game.

We'll be using a demo game, Grid Walking as example along the way.

The code for the is [﻿here](https://github.com/m4-team/zk-sdk/tree/hackathon/sdk) .

> Demo Game: Grid Walking
> This game is extremely bare-bone.
> The game works like this: there’s a 1-dimensional grid of size 1x10. The player can move left or right upon a single click. We’ll record where the player is and how many total steps the player has taken along the way.

[![Grid Walking Game](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=lcGL2JbnoJsrMR_0fMVkyA&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=lcGL2JbnoJsrMR_0fMVkyA)

We store all permanent states on-chain, so we begin by [**﻿checking on-chain storage**](https://github.com/m4-team/zk-sdk/blob/db9bbb9063f1439cf71de875795dbae9271893ab/sdk/frontend/src/App.tsx#L62C9-L62C29) what the current state is.

[![Grid Walking: Initialize](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=tdtohGDz67cECfSedeUItg&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=tdtohGDz67cECfSedeUItg)

The state is used to [**﻿initialize the gameplay**](https://github.com/m4-team/zk-sdk/blob/db9bbb9063f1439cf71de875795dbae9271893ab/sdk/frontend/src/App.tsx#L74) for the ZK program, depending on your game’s logic. (under the hood: this is done by enter the states as public inputs to the ZK program. we'll discuss later about private and public inputs, don't worry)

We’ll let the player [**﻿continue with the gameplay**](https://github.com/m4-team/zk-sdk/blob/db9bbb9063f1439cf71de875795dbae9271893ab/sdk/frontend/src/App.tsx#L97-L99). In the process, we’ll send player inputs as inputs to the ZK program and ask the ZK program what’s the current state of the game to display back to the player.

[![Grid Walking: Interact with ZK](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=d7CHBKZWvVWfMgk3TFeUDw&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=d7CHBKZWvVWfMgk3TFeUDw)

> **Private vs Public Inputs**
> Note that the inputs to the ZK program can be private or public. Private inputs are hidden when the proof is generated and won’t be visible on-chain. Public inputs are otherwise. In general, there are two reasons we want to make an input private. One is that the input is sensitive, like a player’s private key. The other one is when the input is not needed on-chain, so we can save gas fee for players without storing too much junk on precious space on-chain.
> In our demo game, the players inputs are set as private because we don’t need those information on-chain.

[![Private vs Public Inputs](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=iX_wcqQGTl5uNRADxIqBYQ&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=iX_wcqQGTl5uNRADxIqBYQ)

When gameplay is **finished** and we are ready to submit the gameplay to on-chain, we’ll [**﻿generate a ZK proof**](https://github.com/m4-team/zk-sdk/blob/db9bbb9063f1439cf71de875795dbae9271893ab/sdk/frontend/src/App.tsx#L117)\*\* \*\*based on all the inputs we have given to the ZK program. Such proof is generated based on a ZK Program image)

(under the hood: The ZK proof includes three things we are concerned about: 1. All the public inputs, 2. All the outputs 3. The proof itself)

We’ll then [**﻿submit the proof on-chain**](https://github.com/m4-team/zk-sdk/blob/db9bbb9063f1439cf71de875795dbae9271893ab/sdk/frontend/src/App.tsx#L125), and we have provided an [﻿abstract contract](https://github.com/m4-team/zk-sdk/blob/hackathon/sdk/onchain/contracts/SpinContract.sol) on-chain that your contract can implement to help verify the correctness of any proof generated by Spin.

[![Grid Walking: Submit Proof](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=yG5o4ceSOzrsZNmx7CTqcQ&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=yG5o4ceSOzrsZNmx7CTqcQ)

Once the verification is successful, the on-chain game logic contract can then make the appropriate [﻿state updates on-chain](https://github.com/m4-team/zk-sdk/blob/hackathon/sdk/onchain/contracts/GameContract.sol#L48-L53) based on the given public inputs and outputs in the proof.

[![Grid Walking: Verifying the Proof](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi/preview?elements=0JrEHNn6feNOhmlU_-ulHA&type=embed)](https://app.eraser.io/workspace/VhcsNlA4uYelufEWe1gi?elements=0JrEHNn6feNOhmlU_-ulHA)

The cycle repeats again next time when a new gameplay is initiated.
