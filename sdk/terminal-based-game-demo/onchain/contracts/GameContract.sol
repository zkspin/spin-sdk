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

    struct GameRecord {
        uint256 score;
        uint256 gameEndTime;
        uint256 gameStartedTime;
        uint256 seed;
        address player;
    }

    uint256 public totalGames;

    address public verifier;
    address internal _owner;

    mapping(bytes32 => uint256[3]) public zk_image_commitments;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can call this function");
        _;
    }

    modifier onlyGameOwner(bytes32 gameId) {
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

    mapping(bytes32 => Game) public games;

    mapping(bytes32 => GameRecord[10]) public gameLeaderboard;
    mapping(bytes32 => mapping(address => GameRecord[])) public gameRecords;

    mapping(bytes32 => address) public gameAuthors;

    event GameCreated(bytes32 gameId, string name, address author);
    event GameStateUpdated(bytes32 gameId, address player, uint256 score);
    event VerificationSucceeded(address indexed sender);

    function getGameLeaderboard(bytes32 gameId) external view returns (GameRecord[10] memory) {
        return gameLeaderboard[gameId];
    }

    function getGame(bytes32 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getPlayerGameRecords(bytes32 gameId, address player) external view returns (GameRecord[] memory) {
        return gameRecords[gameId][player];
    }

    function commitmentToBytes32(uint256[3] memory commitments) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(commitments[0], commitments[1], commitments[2]));
    }

    function createGame(string memory name, string memory description, uint256[3] calldata commitments) external {
        // increment totalGames
        totalGames = totalGames + 1;

        require(bytes(name).length > 0, "Name cannot be empty");

        bytes32 gameId = commitmentToBytes32(commitments);

        require(games[gameId].createdTime == 0, "Game already exists");

        gameAuthors[gameId] = msg.sender;
        games[gameId] = Game(name, msg.sender, description, block.timestamp, 0, 0);
        emit GameCreated(gameId, name, msg.sender);

        setVerifierImageCommitments(gameId, commitments);
    }

    function updateGame(bytes32 gameId, string memory newName, string memory newDescription)
        external
        onlyGameOwner(gameId)
    {
        Game storage game = games[gameId];
        game.name = newName;
        game.description = newDescription;
    }

    function submitGame(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) external {
        bytes32 gameId = commitmentToBytes32([verify_instance[1], verify_instance[2], verify_instance[3]]);
        require(games[gameId].createdTime != 0, "Game does not exist");
        address player = msg.sender;

        // image commitments verification
        require(verify_instance[1] == zk_image_commitments[gameId][0], "Invalid image commitment 0");
        require(verify_instance[2] == zk_image_commitments[gameId][1], "Invalid image commitment 1");
        require(verify_instance[3] == zk_image_commitments[gameId][2], "Invalid image commitment 2");

        settleProof(proof, verify_instance, aux, instances);

        uint256 _seedFromProof = uint64(instances[0][0]);
        uint256 _scoreFromProof = uint64(instances[0][1]);

        updateLeaderboard(_scoreFromProof, gameId, _seedFromProof);

        // Update game records
        gameRecords[gameId][player].push(
            GameRecord(_scoreFromProof, block.timestamp, block.timestamp, _seedFromProof, player)
        );
        emit GameStateUpdated(gameId, player, _scoreFromProof);
    }

    function updateLeaderboard(uint256 newScore, bytes32 gameId, uint256 seed) internal {
        GameRecord[10] storage leaderboard = gameLeaderboard[gameId];
        address player = msg.sender;

        uint256 index = 0;
        for (uint256 i = 0; i < 10; i++) {
            if (leaderboard[i].score < newScore) {
                index = i;
                break;
            }
        }

        for (uint256 i = 9; i > index; i--) {
            leaderboard[i] = leaderboard[i - 1];
        }

        leaderboard[index] = GameRecord(newScore, block.timestamp, block.timestamp, seed, player);
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

    function setVerifierImageCommitments(bytes32 gameId, uint256[3] calldata commitments)
        public
        onlyGameOwner(gameId)
    {
        zk_image_commitments[gameId][0] = commitments[0];
        zk_image_commitments[gameId][1] = commitments[1];
        zk_image_commitments[gameId][2] = commitments[2];
    }
}
