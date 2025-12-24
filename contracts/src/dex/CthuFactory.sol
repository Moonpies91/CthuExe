// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CthuPair.sol";
import "../interfaces/ICthuFactory.sol";

/**
 * @title CthuFactory
 * @notice Factory contract for creating CthuSwap trading pairs
 * @dev Fork of UniswapV2Factory with immutable fee configuration
 *
 * Fee distribution (0.30% total):
 * - 0.20% to LP providers
 * - 0.05% to CTHU stakers (feeTo)
 * - 0.05% buyback & burn (handled in fee recipient contract)
 */
contract CthuFactory is ICthuFactory {
    address public immutable feeTo;          // Fee recipient (staking rewards + burn handler)
    address public immutable cthuToken;      // CTHU token address
    address public immutable burnAddress;    // Burn address (0xdead)
    address public immutable stakingRewards; // Staking rewards contract

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    /**
     * @notice Deploy the factory with immutable fee configuration
     * @param _feeTo Address to receive protocol fees
     * @param _cthuToken CTHU token address
     * @param _burnAddress Burn address (0xdead)
     * @param _stakingRewards Staking rewards contract
     */
    constructor(
        address _feeTo,
        address _cthuToken,
        address _burnAddress,
        address _stakingRewards
    ) {
        require(_feeTo != address(0), "CthuFactory: ZERO_FEE_TO");
        require(_cthuToken != address(0), "CthuFactory: ZERO_CTHU");
        require(_burnAddress != address(0), "CthuFactory: ZERO_BURN");
        require(_stakingRewards != address(0), "CthuFactory: ZERO_STAKING");

        feeTo = _feeTo;
        cthuToken = _cthuToken;
        burnAddress = _burnAddress;
        stakingRewards = _stakingRewards;
    }

    /**
     * @notice Returns the total number of pairs created
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /**
     * @notice Creates a new trading pair for two tokens
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "CthuFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "CthuFactory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "CthuFactory: PAIR_EXISTS");

        bytes memory bytecode = type(CthuPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        CthuPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
