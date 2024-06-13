//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

contract SpinGamePlayground {
    struct Game {
        string name;
        address author;
        string description;
        uint256 createdTime;
        uint256 totalPlayers;
        uint256 totalGamesPlayed;
    }

    struct GameState {
        uint256 score;
        uint256 gameEndTime;
        uint256 gameStartedTime;
        uint256 seed;
    }

    uint256 public totalGames;

    address public verifier;
    address internal _owner;

    mapping(uint256 => uint256[3]) public zk_image_commitments;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can call this function");
        _;
    }

    modifier onlyGameOwner(uint256 gameId) {
        require(
            gameAuthors[gameId] == msg.sender || msg.sender == _owner, "Only the author or Admin can update the game"
        );
        _;
    }

    constructor(address _verifier_address) {
        _owner = msg.sender;
        verifier = _verifier_address;
        totalGames = 0;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => GameState)) public gameStates;
    mapping(uint256 => address) public gameAuthors;

    event GameCreated(uint256 gameId, string name, address author);
    event GameStateUpdated(uint256 gameId, address player, uint256 score);
    event VerificationSucceeded(address indexed sender);

    function createGame(string memory name, string memory description) external {
        // increment totalGames
        totalGames = totalGames + 1;
        uint256 gameId = totalGames;

        gameAuthors[gameId] = msg.sender;
        games[gameId] = Game(name, msg.sender, description, block.timestamp, 0, 0);
        emit GameCreated(gameId, name, msg.sender);
    }

    function updateGame(uint256 gameId, string memory newName, string memory newDescription)
        external
        onlyGameOwner(gameId)
    {
        Game storage game = games[gameId];
        game.name = newName;
        game.description = newDescription;
    }

    function startGame(uint256 gameId) public {
        // check if the game exists
        require(games[gameId].createdTime != 0, "Game does not exist");
        uint256 seed = generatePseudoRandomNumber();
        gameStates[gameId][msg.sender] = GameState(0, 0, block.timestamp, seed);
    }

    function finishGame(
        uint256 gameId,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public {
        address player = msg.sender;
        GameState storage state = gameStates[gameId][player];
        require(state.gameStartedTime != 0, "Game has not started yet");
        require(state.gameEndTime == 0, "Game has already finished");

        // image commitments verification
        require(verify_instance[1] == zk_image_commitments[gameId][0], "Invalid image commitment 0");
        require(verify_instance[2] == zk_image_commitments[gameId][1], "Invalid image commitment 1");
        require(verify_instance[3] == zk_image_commitments[gameId][2], "Invalid image commitment 2");

        settleProof(proof, verify_instance, aux, instances);

        uint256 _seedFromProof = uint64(instances[0][0]);
        uint256 _scoreFromProof = uint64(instances[0][1]);

        require(_seedFromProof == state.seed, "Seed does not match");
        state.score = _scoreFromProof;
        state.gameEndTime = block.timestamp;
        emit GameStateUpdated(gameId, player, _scoreFromProof);
    }

    function startAndFinishGame(
        uint256 gameId,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) external {
        require(games[gameId].createdTime != 0, "Game does not exist");
        gameStates[gameId][msg.sender] = GameState(0, 0, block.timestamp, 0);
        finishGame(gameId, proof, verify_instance, aux, instances);
    }

    // UTILITY FUNCTIONS

    // Function to generate a pseudo-random number
    function generatePseudoRandomNumber() public view returns (uint256) {
        // Combine block.timestamp and msg.sender to generate a pseudo-random number
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        return random;
    }

    /* VERIFY ZK FUNCTIONS: THESE FUNCTIONS CAN BE EVENTUALLY AUTO-GENERATED */

    /*
     * @dev Reverse the bytes of a 64 bit integer
     */

    function reverseBytes(uint64 input) internal pure returns (uint64) {
        uint64 reversed = 0;
        for (uint256 i = 0; i < 8; i++) {
            reversed = (reversed << 8) | ((input >> (8 * i)) & 0xFF);
        }
        return reversed;
    }

    // Submit and settle the proof
    function settleProof(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public {
        IZKVerifier(verifier).verify(proof, verify_instance, aux, instances);

        emit VerificationSucceeded(msg.sender);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function setOwner(address new_owner) external onlyOwner {
        _owner = new_owner;
    }

    function setVerifier(address verifier_address) external onlyOwner {
        verifier = verifier_address;
    }

    function setVerifierImageCommitments(uint256 gameId, uint256[3] calldata commitments)
        external
        onlyGameOwner(gameId)
    {
        zk_image_commitments[gameId][0] = commitments[0];
        zk_image_commitments[gameId][1] = commitments[1];
        zk_image_commitments[gameId][2] = commitments[2];
    }
}
