// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Leaderboard
 * @notice Weekly burn-to-promote ranking system for launched tokens
 * @dev Track CTHU burned per token per week, reset every Monday 00:00 UTC
 *
 * Features:
 * - Weekly reset (Monday 00:00 UTC)
 * - Track burns per token per week
 * - Historical data preservation
 * - Top 10 display support
 * - Anyone can burn for any token
 */
contract Leaderboard is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant WEEK_DURATION = 7 days;

    // ============ State Variables ============

    IERC20 public immutable cthu;
    uint256 public immutable genesisWeekStart;

    // Week number => token => burns
    mapping(uint256 => mapping(address => uint256)) public weeklyBurns;

    // Week number => list of tokens with burns
    mapping(uint256 => address[]) public weeklyTokens;

    // Week number => token => whether it's been added to weeklyTokens
    mapping(uint256 => mapping(address => bool)) public tokenInWeek;

    // Token => total all-time burns
    mapping(address => uint256) public totalBurns;

    // User => token => total burns
    mapping(address => mapping(address => uint256)) public userBurnsForToken;

    // ============ Events ============

    event BurnedForRank(
        address indexed token,
        address indexed burner,
        uint256 amount,
        uint256 weekNumber
    );

    // ============ Constructor ============

    /**
     * @notice Deploy the leaderboard contract
     * @param _cthu CTHU token address
     */
    constructor(address _cthu) {
        require(_cthu != address(0), "Leaderboard: Invalid CTHU");

        cthu = IERC20(_cthu);

        // Calculate genesis week start (most recent Monday 00:00 UTC)
        uint256 currentTime = block.timestamp;
        uint256 dayOfWeek = (currentTime / 1 days + 4) % 7; // 0 = Monday
        genesisWeekStart = currentTime - (dayOfWeek * 1 days) - (currentTime % 1 days);
    }

    // ============ Core Functions ============

    /**
     * @notice Burn CTHU to promote a token on the leaderboard
     * @param token Token address to promote
     * @param amount Amount of CTHU to burn
     */
    function burnForRank(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Leaderboard: Invalid token");
        require(amount > 0, "Leaderboard: Zero amount");

        uint256 currentWeek = getWeekNumber();

        // Transfer CTHU to burn address
        cthu.safeTransferFrom(msg.sender, BURN_ADDRESS, amount);

        // Update weekly burns
        weeklyBurns[currentWeek][token] += amount;

        // Track token in this week's list if not already
        if (!tokenInWeek[currentWeek][token]) {
            tokenInWeek[currentWeek][token] = true;
            weeklyTokens[currentWeek].push(token);
        }

        // Update total burns
        totalBurns[token] += amount;

        // Update user burns
        userBurnsForToken[msg.sender][token] += amount;

        emit BurnedForRank(token, msg.sender, amount, currentWeek);
    }

    // ============ View Functions ============

    /**
     * @notice Get current week number
     * @return weekNumber Current week number (0-indexed from genesis)
     */
    function getWeekNumber() public view returns (uint256 weekNumber) {
        if (block.timestamp < genesisWeekStart) return 0;
        weekNumber = (block.timestamp - genesisWeekStart) / WEEK_DURATION;
    }

    /**
     * @notice Get week start timestamp
     * @param weekNumber Week number
     * @return startTime Week start timestamp
     */
    function getWeekStart(uint256 weekNumber) public view returns (uint256 startTime) {
        startTime = genesisWeekStart + (weekNumber * WEEK_DURATION);
    }

    /**
     * @notice Get week end timestamp
     * @param weekNumber Week number
     * @return endTime Week end timestamp
     */
    function getWeekEnd(uint256 weekNumber) public view returns (uint256 endTime) {
        endTime = genesisWeekStart + ((weekNumber + 1) * WEEK_DURATION);
    }

    /**
     * @notice Get burns for a token in current week
     * @param token Token address
     * @return burns Amount burned this week
     */
    function getCurrentWeekBurns(address token) external view returns (uint256 burns) {
        burns = weeklyBurns[getWeekNumber()][token];
    }

    /**
     * @notice Get burns for a token in a specific week
     * @param weekNumber Week number
     * @param token Token address
     * @return burns Amount burned that week
     */
    function getWeekBurns(uint256 weekNumber, address token) external view returns (uint256 burns) {
        burns = weeklyBurns[weekNumber][token];
    }

    /**
     * @notice Get top tokens for current week
     * @param count Number of tokens to return (max 10)
     * @return tokens Array of token addresses
     * @return burns Array of burn amounts
     */
    function getTopTokens(uint256 count) external view returns (
        address[] memory tokens,
        uint256[] memory burns
    ) {
        return getTopTokensForWeek(getWeekNumber(), count);
    }

    /**
     * @notice Get top tokens for a specific week
     * @param weekNumber Week number
     * @param count Number of tokens to return (max 10)
     * @return tokens Array of token addresses (sorted by burns descending)
     * @return burns Array of burn amounts
     */
    function getTopTokensForWeek(uint256 weekNumber, uint256 count) public view returns (
        address[] memory tokens,
        uint256[] memory burns
    ) {
        address[] storage weekTokens = weeklyTokens[weekNumber];
        uint256 tokenCount = weekTokens.length;

        if (count > tokenCount) count = tokenCount;
        if (count > 10) count = 10;

        // Create arrays for sorting
        address[] memory allTokens = new address[](tokenCount);
        uint256[] memory allBurns = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            allTokens[i] = weekTokens[i];
            allBurns[i] = weeklyBurns[weekNumber][weekTokens[i]];
        }

        // Simple bubble sort (fine for small arrays)
        for (uint256 i = 0; i < tokenCount; i++) {
            for (uint256 j = i + 1; j < tokenCount; j++) {
                if (allBurns[j] > allBurns[i]) {
                    // Swap burns
                    uint256 tempBurn = allBurns[i];
                    allBurns[i] = allBurns[j];
                    allBurns[j] = tempBurn;

                    // Swap tokens
                    address tempToken = allTokens[i];
                    allTokens[i] = allTokens[j];
                    allTokens[j] = tempToken;
                }
            }
        }

        // Return top `count` tokens
        tokens = new address[](count);
        burns = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            tokens[i] = allTokens[i];
            burns[i] = allBurns[i];
        }
    }

    /**
     * @notice Get historical leaderboard for a week
     * @param weekNumber Week number
     * @return tokens Array of all token addresses with burns
     * @return burns Array of burn amounts
     */
    function getHistoricalLeaderboard(uint256 weekNumber) external view returns (
        address[] memory tokens,
        uint256[] memory burns
    ) {
        return getTopTokensForWeek(weekNumber, 10);
    }

    /**
     * @notice Get week info
     * @param weekNumber Week number
     * @return startTime Week start timestamp
     * @return endTime Week end timestamp
     * @return tokenCount Number of tokens with burns
     * @return isCurrentWeek Whether this is the current week
     */
    function getWeekInfo(uint256 weekNumber) external view returns (
        uint256 startTime,
        uint256 endTime,
        uint256 tokenCount,
        bool isCurrentWeek
    ) {
        startTime = getWeekStart(weekNumber);
        endTime = getWeekEnd(weekNumber);
        tokenCount = weeklyTokens[weekNumber].length;
        isCurrentWeek = weekNumber == getWeekNumber();
    }

    /**
     * @notice Get user's contribution to a token's ranking
     * @param user User address
     * @param token Token address
     * @return totalBurned Total CTHU burned by user for this token
     */
    function getUserContribution(address user, address token) external view returns (uint256 totalBurned) {
        totalBurned = userBurnsForToken[user][token];
    }

    /**
     * @notice Get current week time remaining
     * @return secondsRemaining Seconds until week reset
     */
    function getTimeUntilReset() external view returns (uint256 secondsRemaining) {
        uint256 currentWeek = getWeekNumber();
        uint256 weekEnd = getWeekEnd(currentWeek);

        if (block.timestamp >= weekEnd) return 0;
        secondsRemaining = weekEnd - block.timestamp;
    }
}
