# Building Trustless Provable Game Using SPIN

# Source Code Repository

[﻿github.com/m4-team/spin-sdk](https://github.com/m4-team/spin-sdk)

# Outline

-   [Preliminary Knowledge](./1_PRELIMINARY_KNOWLEDGE.md)
-   [Introduction](./2_INTRODUCTION.md)
-   [Terminologies](./3_TERMINOLOGIES.md)
-   [How Spin Works](./4_HOW_SPIN_WORKS.md)
-   [-> Technical Guide](./5_TECHNICAL_GUIDE.md) / [-> Hackathon Technical Guide](./5_TECHNICAL_GUIDE_HACKATHON.md)

# About Performance

Zero-Knowledge Proofs rollups can make significant performance improvement in terms of speed and cost compared to traditional fully on-chain games.

#### Batching Transactions

The primary advantage of ZK-proved rollups lies in their ability to expedite processing speeds. By conducting computation off-chain and then rolling up multiple transaction outcomes into a single proof, these rollups substantially reduce the transaction processing time, enhancing game responsiveness and player experience.

[TODO diag of batched rollup]

#### Chain Agnostic

Additionally, zk-proved rollups are chain agnostic, meaning they can operate across different blockchain platforms without being restricted to a specific chain's protocol or infrastructure. This flexibility allows for broader adoption and integration into various gaming ecosystems.

[TODO diag of ZK program is not on any chain]

#### No Gas-Fee

Moreover, by handling transactions off-chain, zk-proved rollups effectively bypass the network's gas fees, which are typically required for on-chain operations. This not only makes gaming more cost-effective but also scales the games to accommodate a larger user base without incurring prohibitive costs. Thus, ZK-proved rollups offer a faster, more versatile, and economically efficient alternative to fully on-chain games.

[TODO diag of gas fee difference]

# Future Prospects

#### Future of ZK

As researchers and developers continue to optimize algorithms, the computational demand and cost associated with zero-knowledge proofs are expected to decrease significantly.

[diag of prospect zk speed improvement]

This progress will enable more practical and widespread applications of zero-knowledge proofs across various industries, including gaming.

As the speed of these proofs increases, the feasibility of running them on local machines, such as user smartphones or personal computers, becomes more realistic.

[TODO diag of user proving on local machine]

This shift will not only enhance user privacy by allowing data to be verified without revealing underlying information but will also democratize access to secure, trustless verification processes, embedding robust security features directly into everyday technology.

#### Multiplayer Games

This guide so far only covers games that only need input from a single player. However, we know the fun of real time multi-players games. This multi-player ZK gaming is still under heavy research, and here at Spin, we aim to work on fast, efficient, low-cost, developer friend multiplayer ZK solutions.

As this technology matures, it could lead to a paradigm shift in how games are developed, played, and monetized, offering a more immersive and secure gaming experience that leverages the unique benefits of blockchain technology.

[TODO diag of different computations are running ZK proving and reach consensys]

# Community Support

If you have any questions or want to collaborate with us, you are most welcome to join our Discord group for further discussions.
