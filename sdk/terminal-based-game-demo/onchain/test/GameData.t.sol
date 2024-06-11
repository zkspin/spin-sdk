//  TODO: convert this into hardhat tests

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {GameData} from "../src/GameData.sol";

contract CounterTest is Test {
    GameData public gameDataContract;

    function setUp() public {
        gameDataContract = new GameData();

        address owner = address(this);
        address verifier = 0xfD74dce645Eb5EB65D818aeC544C72Ba325D93B0;
        gameDataContract.initialize(owner, verifier);
        assertEq(gameDataContract.owner(), address(this));
        assertEq(gameDataContract.getVerifier(), verifier);
        gameDataContract.setVerify(false); // disable verification for testing
    }

    function test_random_number() public {
        uint256 randomNumber = gameDataContract.generatePseudoRandomNumber();
        console.log("randomNumber: ", randomNumber);

        assertNotEq(randomNumber, 0);
    }

    function test_verifier() public {
        gameDataContract.setVerifier(address(0));
        assertEq(gameDataContract.getVerifier(), address(0));
    }

    function test_create_game() public {
        gameDataContract.createGame("game1", "description1");
        assertEq(gameDataContract.totalGames(), 1);

        gameDataContract.createGame("game2", "description2");
        assertEq(gameDataContract.totalGames(), 2);

        assertEq(gameDataContract.gameAuthors(1), address(this));
        assertEq(gameDataContract.gameAuthors(2), address(this));

        (
            string memory name,
            address author,
            string memory description,
            uint256 createdTime,
            uint256 totalPlayers,
            uint256 totalGamesPlayed
        ) = gameDataContract.games(1);

        assertEq(name, "game1");
        assertEq(author, address(this));
        assertEq(description, "description1");
        assertEq(totalPlayers, 0);
        assertEq(totalGamesPlayed, 0);
    }

    function test_update_game_state() public {
        uint256 gameId = gameDataContract.totalGames() + 1;
        vm.expectEmit();
        emit GameData.GameCreated(gameId, "game3", address(this));
        gameDataContract.createGame("game3", "description3");

        gameDataContract.updateGame(gameId, "game3_updated", "description3_updated");

        (
            string memory name,
            address author,
            string memory description,
            uint256 createdTime,
            uint256 totalPlayers,
            uint256 totalGamesPlayed
        ) = gameDataContract.games(gameId);

        assertEq(name, "game3_updated");
        assertEq(author, address(this));
        assertEq(description, "description3_updated");
        assertEq(totalPlayers, 0);
        assertEq(totalGamesPlayed, 0);
    }

    function test_start_game() public {
        uint256 gameId = gameDataContract.totalGames() + 1;
        gameDataContract.createGame("game4", "description4");

        gameDataContract.startGame(gameId);

        (uint256 score, uint256 gameEndTime, uint256 gameStartedTime, uint256 seed) =
            gameDataContract.gameStates(gameId, address(this));

        assertEq(score, 0);
        assertEq(gameEndTime, 0);
        assertNotEq(gameStartedTime, 0);
        assertNotEq(seed, 0);
    }

    // function test_Increment() public {
    //     counter.increment();
    //     assertEq(counter.number(), 1);
    // }

    // function testFuzz_SetNumber(uint256 x) public {
    //     counter.setNumber(x);
    //     assertEq(counter.number(), x);
    // }
}
