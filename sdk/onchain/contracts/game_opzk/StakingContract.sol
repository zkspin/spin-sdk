// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

abstract contract SpinStakingContract {
    uint256 public constant OPERATOR_ETH_STAKED_PER_SUBMISSION = 100 wei;
    uint256 public constant OPERATOR_ETH_SLASHED_BURNED_PERCENTAGE = 500; // 50%
    uint256 public constant OPERATOR_ETH_SLASHED_CHALLENGER_REWARD_PERCENTAGE = 500; // 50%

    uint256 public constant DA_ETH_STAKED_PER_SUBMISSION = 100 wei;
    uint256 public constant DA_ETH_SLASHED_BURNED_PERCENTAGE = 500; // 50%
    uint256 public constant DA_ETH_SLASHED_CHALLENGER_REWARD_PERCENTAGE = 500; // 50%

    uint256 public constant CHALLENGER_ETH_BLOCK_WINDOW = 100; // 100 blocks
    uint256 public constant CHALLENGER_ETH_STAKE_PER_BLOCK = 10 wei;
    uint256 public constant CHALLENGER_ETH_SLASHED_BURNED_PERCENTAGE = 300; // 30%
    uint256 public constant CHALLENGER_ETH_SLASHED_CHALLENGER_REWARD_PERCENTAGE = 700; // 70%
    uint256 public constant CHALLENGER_SLASHING_CHALLENG_WINDOW = 1000; // 1000 blocks
    uint256 public constant CHALLENGER_POOL_MAX_SIZE = 100;

    address public gameContract;

    modifier isGameContract() {
        require(msg.sender == gameContract, "Caller is not the game contract");
        _;
    }

    /* 
        operator needs to stake enough token in order to submit
        transaction. The more # of txn concurrently in the
        settlement period, the more token needs to be staked.
    */
    function operator_stake() external payable virtual;

    /*
        handle when operator withdraws money
    */
    function operator_withdraw(uint256 withdrawAmount) external virtual;

    /*
        handle when operator submits submission
    */
    function operator_submit_submission(uint256 submissionCount, address operator) external virtual;

    /**
     * handle when operator settles submission
     */
    function operator_settle_submission(uint256 submissionCount, address operator) external virtual;
    /*
        handle when operator gets slashed upon a successful challenge
        part is transferred to challenger
        part is burned
    */
    function operator_slash(uint256 slashedSubmissionCount, address challenger, address operator) external virtual;

    /**
     * DA staking function only for disput-based DA's.
     * transaction. The more # of txn concurrently in the
     * settlement period, the more token needs to be staked.
     * @dev DA needs to stake enough token in order to sign
     */
    function da_stake() external payable virtual;

    function da_withdraw() external virtual;

    /**
     * slashed upon DA resolve window passed and no DA response
     * part of slashed fund is transferred to the challenger
     * part is burned
     */
    function da_slash() external virtual;

    /**
     * challenger commits a block window to challenge an invalid transaction
     */
    function challenger_stake() external payable virtual;

    /**
     * challenger withdraws money
     */
    function challenger_withdraw(uint256 withdrawAmount) external virtual;

    /**
     * challenger get slashed when someone can proof under a committed challenge
     * window the challengers did not challenge an invalid transaction
     *  part is transferred to the challenger of the challenger
     * part if burned
     *
     */
    function challenger_slashing(address challengerToBeRewarded, uint256 unchallengedSubmissionBlockNumber)
        external
        virtual;
}

contract StakingContract is SpinStakingContract {
    constructor(address _gameContract) {
        gameContract = _gameContract;
    }

    mapping(address => uint256) public operatorStake;
    mapping(address => uint256) public operatorSubmittingSubmissionCount;

    mapping(address => uint256) public challengerStake;
    mapping(address => uint256) public challengerCommittedBlockWindowCount;

    // mapping of start block to a list of challengers
    // who committed to challenge the block window
    mapping(uint256 => address[]) public challengerPool;

    event OperatorStake(address indexed operator, uint256 amount);
    event OperatorWithdraw(address indexed operator, uint256 amount);
    event OperatorSubmitSubmission(address indexed operator, uint256 submissionCount);
    event OperatorSettleSubmission(address indexed operator, uint256 submissionCount);
    event OperatorSlash(
        address indexed operator,
        address indexed challenger,
        uint256 slashedSubmissionCount,
        uint256 burnedAmount,
        uint256 challengerReward
    );

    event ChallengerStake(address indexed challenger, uint256 amount);
    event ChallengerWithdraw(address indexed challenger, uint256 amount);
    event ChallengerCommitBlockWindow(
        address indexed challenger, uint256 startBlock, uint256 endBlock, uint256 stakePerBlock
    );

    event ChallengerSettleCommitBlockWindow(
        address indexed challenger, uint256[] startBlocks, uint256[] challengerPoolIndex
    );

    event ChallengerSlash(
        address indexed challengerToBeSlashed,
        address indexed challengerToBeRewarded,
        uint256 slashingStartBlock,
        uint256 slashingChallengerPoolIndex
    );

    function operator_stake() external payable override {
        operatorStake[msg.sender] += msg.value;

        emit OperatorStake(msg.sender, msg.value);
    }

    function operator_withdraw(uint256 withdrawAmount) external override {
        uint256 availableStake = operator_available_stake(msg.sender);

        require(availableStake >= withdrawAmount, "Insufficient balance");

        operatorStake[msg.sender] -= withdrawAmount;

        payable(msg.sender).transfer(withdrawAmount);

        emit OperatorWithdraw(msg.sender, withdrawAmount);
    }

    function operator_submit_submission(uint256 submissionCount, address operator) external override isGameContract {
        uint256 requiredStake = submissionCount * OPERATOR_ETH_STAKED_PER_SUBMISSION;
        uint256 availableStake = operator_available_stake(operator);

        require(availableStake >= requiredStake, "Insufficient balance");

        operatorSubmittingSubmissionCount[operator] += submissionCount;

        emit OperatorSubmitSubmission(operator, submissionCount);
    }

    /**
     * No need to call settle submission if submission is already slashed
     */
    function operator_settle_submission(uint256 submissionCount, address operator) public override isGameContract {
        operatorSubmittingSubmissionCount[operator] = operatorSubmittingSubmissionCount[operator] - submissionCount;

        emit OperatorSettleSubmission(operator, submissionCount);
    }

    /**
     *
     * @param slashedSubmissionCount # of submission that operator has been slashed. In most cases 1
     */
    function operator_slash(uint256 slashedSubmissionCount, address challenger, address operator)
        external
        override
        isGameContract
    {
        uint256 totalSlashedAmount = slashedSubmissionCount * OPERATOR_ETH_STAKED_PER_SUBMISSION;

        require(totalSlashedAmount <= operatorStake[operator], "Insufficient balance to be slashed");

        uint256 burnedAmount = (totalSlashedAmount * OPERATOR_ETH_SLASHED_BURNED_PERCENTAGE) / 1000;
        uint256 challengerRewardAmount = (totalSlashedAmount * OPERATOR_ETH_SLASHED_CHALLENGER_REWARD_PERCENTAGE) / 1000;

        // burn
        payable(address(0)).transfer(burnedAmount);

        // transfer to challenger
        payable(challenger).transfer(challengerRewardAmount);

        operatorStake[operator] -= totalSlashedAmount;

        operator_settle_submission(slashedSubmissionCount, operator);

        emit OperatorSlash(operator, challenger, slashedSubmissionCount, burnedAmount, challengerRewardAmount);
    }

    function operator_available_stake(address operator) public view returns (uint256 stake) {
        stake =
            operatorStake[operator] - (operatorSubmittingSubmissionCount[operator] * OPERATOR_ETH_STAKED_PER_SUBMISSION);
    }

    function da_stake() external payable virtual override {
        // TODO
    }

    function da_withdraw() external virtual override {
        // TODO
    }

    function da_slash() external virtual override isGameContract {
        // TODO
    }

    /**
     * challenger commits a block window to challenge an invalid transaction
     */
    function challenger_stake() external payable override {
        challengerStake[msg.sender] += msg.value;

        emit ChallengerStake(msg.sender, msg.value);
    }

    /**
     * challenger commits a block window to challenge invalid transactions
     * in order to receive passive rewards
     */
    function challenger_commit_block_window(uint256 startBlock, uint256 endBlock) external {
        require((endBlock - startBlock) % CHALLENGER_ETH_BLOCK_WINDOW == 0, "Invalid block window range, not multiple");

        require(startBlock > block.number, "Invalid start block, need to be in the future");

        require(endBlock > startBlock, "Invalid block window range, end block must be greater than start block");

        require(
            startBlock % CHALLENGER_ETH_BLOCK_WINDOW == 0, "Invalid start block, need to be multiple of block window"
        );

        uint256 availableStake = challenger_available_stake(msg.sender);

        require(availableStake >= (endBlock - startBlock) * CHALLENGER_ETH_STAKE_PER_BLOCK, "Insufficient balance");

        require(challengerPool[startBlock].length < CHALLENGER_POOL_MAX_SIZE, "Challenger pool is full");

        for (uint256 i = startBlock; i < endBlock; i += CHALLENGER_ETH_BLOCK_WINDOW) {
            challengerPool[startBlock].push(msg.sender);
        }

        challengerCommittedBlockWindowCount[msg.sender] += (endBlock - startBlock) / CHALLENGER_ETH_BLOCK_WINDOW;

        emit ChallengerCommitBlockWindow(msg.sender, startBlock, endBlock, CHALLENGER_ETH_STAKE_PER_BLOCK);
    }

    /**
     *
     * @param startBlocks a list of the start block of the committed block window
     * @param challengerPoolIndex a list of the index of the challenger in the challenger pool
     */
    function challenger_settle_commit_block_window(
        uint256[] calldata startBlocks,
        uint256[] calldata challengerPoolIndex
    ) external {
        for (uint256 i = 0; i < startBlocks.length; i++) {
            require(
                startBlocks[i] + CHALLENGER_ETH_BLOCK_WINDOW + CHALLENGER_SLASHING_CHALLENG_WINDOW < block.number,
                "Invalid block window, need to be in the past"
            );

            require(challengerPool[startBlocks[i]][challengerPoolIndex[i]] == msg.sender, "Invalid challenger");

            // TODO: give out rewards to challengers based on the position in the challenger pool

            challengerPool[startBlocks[i]][challengerPoolIndex[i]] = address(0); // prevent settle twice
        }

        challengerCommittedBlockWindowCount[msg.sender] -= startBlocks.length;

        emit ChallengerSettleCommitBlockWindow(msg.sender, startBlocks, challengerPoolIndex);
    }

    /**
     * challenger withdraws money
     * @param withdrawAmount amount to withdraw
     */
    function challenger_withdraw(uint256 withdrawAmount) external override {
        uint256 availableStake = challenger_available_stake(msg.sender);

        require(availableStake >= withdrawAmount, "Insufficient balance");

        challengerStake[msg.sender] -= withdrawAmount;

        payable(msg.sender).transfer(withdrawAmount);

        emit ChallengerWithdraw(msg.sender, withdrawAmount);
    }

    /**
     * Slashed when someone can proof under a committed challenge
     * window the challengers did not challenge an invalid transaction
     * part is transferred to the challenger of the challenger
     * part if burned
     *
     * Slashing is assumed to be 1 block window
     */
    function challenger_slashing(address challengerToBeRewarded, uint256 unchallengedSubmissionBlockNumber)
        external
        override
        isGameContract
    {
        uint256 slashingStartBlock =
            unchallengedSubmissionBlockNumber - (unchallengedSubmissionBlockNumber % CHALLENGER_ETH_BLOCK_WINDOW);

        require(
            slashingStartBlock + CHALLENGER_ETH_BLOCK_WINDOW + CHALLENGER_SLASHING_CHALLENG_WINDOW <= block.number,
            "Challenge window already passed"
        );

        for (uint256 i = 0; i < challengerPool[slashingStartBlock].length; i++) {
            address challengerToBeSlashed = challengerPool[slashingStartBlock][i];

            require(
                challengerCommittedBlockWindowCount[challengerToBeSlashed] > 0,
                "Challenger has not committed to any block window"
            );

            uint256 totalSlashedAmount = CHALLENGER_ETH_STAKE_PER_BLOCK * CHALLENGER_ETH_BLOCK_WINDOW;

            require(challengerStake[challengerToBeSlashed] >= totalSlashedAmount, "Insufficient balance to be slashed");

            uint256 burnedAmount = (totalSlashedAmount * CHALLENGER_ETH_SLASHED_BURNED_PERCENTAGE) / 1000;
            uint256 challengerRewardAmount =
                (totalSlashedAmount * CHALLENGER_ETH_SLASHED_CHALLENGER_REWARD_PERCENTAGE) / 1000;

            // burn
            payable(address(0)).transfer(burnedAmount);

            // transfer to challenger
            payable(challengerToBeRewarded).transfer(challengerRewardAmount);

            challengerStake[challengerToBeSlashed] -= totalSlashedAmount;

            challengerCommittedBlockWindowCount[challengerToBeSlashed] -= 1;

            challengerPool[slashingStartBlock][i] = address(0);

            emit ChallengerSlash(challengerToBeSlashed, challengerToBeRewarded, slashingStartBlock, i);
        }
    }

    function challenger_available_stake(address challenger) public view returns (uint256) {
        return challengerStake[challenger]
            - (
                challengerCommittedBlockWindowCount[challenger] * CHALLENGER_ETH_BLOCK_WINDOW
                    * CHALLENGER_ETH_STAKE_PER_BLOCK
            );
    }

    /**
     * TODO implement a fallback function challenge one challenger at a time
     * this is to prevent gas limit issue
     */
}
