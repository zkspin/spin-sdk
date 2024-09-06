# Frontend

This is the frontend with a example of a grid walking game.

> Demo Game: Grid Walking
> Before starting, let me introduce you a demo game we'll be using as examples along the way. This game is extremely bare-bone. It will be a game of walking in a 1-dimensional grid.
> The game works like this: there’s a 1-dimensional grid of size 1x10. The player can move left or right upon a single click. We’ll record where the player is and how many total steps the player has taken along the way.

The game logic is inside `gameplay/`
The smart contracts are inside `onchain/`

## Getting Started

Install dependencies

```bash
npm i
```

Setup `.env` next to `template.env` with your zkWasm cloud proving account.

## Run the development server:

```bash
npm run dev
```

## Misc

Minor Issues:

-   ESM WASM difficult to used Jest to debug.
