// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LaunchedToken.sol";
import "../interfaces/ICthuFactory.sol";
import "../interfaces/ICthuRouter.sol";

/**
 * @title CultistLaunchpad
 * @notice Token launch platform with bonding curves and graduation mechanism
 * @dev Pump.fun style bonding curve with CTHU burn mechanics
 *
 * Features:
 * - Token summoning with 100 MONAD fee (swapped to CTHU and burned)
 * - Exponential bonding curve pricing
 * - Graduation at 50,000 USDT equivalent in MONAD
 * - Post-graduation liquidity on CthuSwap
 * - Sell lock mechanism with force unlock option
 */
contract CultistLaunchpad is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct TokenInfo {
        address tokenAddress;
        address creator;
        uint256 tokensSold;           // Tokens sold through bonding curve
        uint256 monadRaised;          // Total MONAD raised
        uint256 virtualReserve;       // Virtual reserve for bonding curve
        bool graduated;               // Whether token has graduated
        uint256 graduatedAt;          // Timestamp of graduation
        bool sellLocked;              // Whether selling is locked
        uint256 lockExpiry;           // When lock expires
        uint256 creatorBurnedForLock; // CTHU burned by creator for lock
    }

    // ============ Constants ============

    uint256 public constant LAUNCH_FEE = 100 ether;           // 100 MONAD
    uint256 public constant GRADUATION_THRESHOLD = 50_000e18; // $50,000 USD equivalent
    uint256 public constant BONDING_CURVE_SUPPLY = 800_000_000 * 10**18;
    uint256 public constant LIQUIDITY_SUPPLY = 150_000_000 * 10**18;

    // Initial virtual reserve calibrated for ~$0.00001 starting price
    uint256 public constant INITIAL_VIRTUAL_RESERVE = 100 ether;

    // Post-graduation fund distribution (basis points)
    uint256 public constant LP_SHARE = 8000;           // 80%
    uint256 public constant CREATOR_SHARE = 1000;      // 10%
    uint256 public constant TREASURY_SHARE = 500;      // 5%
    uint256 public constant CTHU_BUYBACK_SHARE = 300;  // 3%
    uint256 public constant CTHU_LP_SHARE = 200;       // 2%

    // Sell lock constants
    uint256 public constant LOCK_BASE_COST = 10_000 * 10**18;  // 10,000 CTHU base
    uint256 public constant LOCK_MULTIPLIER = 125;             // 1.25x per day (125/100)
    uint256 public constant FORCE_UNLOCK_MULTIPLIER = 5;       // 5x to force unlock
    uint256 public constant LOCK_BURN_PERCENT = 95;            // 95% burned
    uint256 public constant LOCK_TREASURY_PERCENT = 5;         // 5% to treasury

    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ============ State Variables ============

    IERC20 public immutable cthu;
    ICthuFactory public immutable factory;
    ICthuRouter public immutable router;
    address public immutable treasury;
    address public immutable wmonad;

    mapping(address => TokenInfo) public tokens;
    address[] public allTokens;

    // ============ Events ============

    event TokenSummoned(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        string imageUri
    );
    event TokenBought(
        address indexed token,
        address indexed buyer,
        uint256 monadAmount,
        uint256 tokenAmount
    );
    event TokenSold(
        address indexed token,
        address indexed seller,
        uint256 tokenAmount,
        uint256 monadAmount
    );
    event TokenGraduated(
        address indexed token,
        uint256 totalRaised,
        address lpPair
    );
    event SellsLocked(
        address indexed token,
        uint256 duration,
        uint256 cthuBurned
    );
    event SellsUnlocked(
        address indexed token,
        address indexed unlocker,
        uint256 cthuBurned
    );

    // ============ Constructor ============

    constructor(
        address _cthu,
        address _factory,
        address _router,
        address _treasury,
        address _wmonad
    ) {
        require(_cthu != address(0), "CultistLaunchpad: Invalid CTHU");
        require(_factory != address(0), "CultistLaunchpad: Invalid factory");
        require(_router != address(0), "CultistLaunchpad: Invalid router");
        require(_treasury != address(0), "CultistLaunchpad: Invalid treasury");
        require(_wmonad != address(0), "CultistLaunchpad: Invalid WMONAD");

        cthu = IERC20(_cthu);
        factory = ICthuFactory(_factory);
        router = ICthuRouter(_router);
        treasury = _treasury;
        wmonad = _wmonad;
    }

    // ============ Token Summoning ============

    /**
     * @notice Summon a new token on the launchpad
     * @param name Token name
     * @param symbol Token symbol
     * @param imageUri Token image URI
     * @return tokenAddress Address of the created token
     */
    function summonToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUri
    ) external payable nonReentrant returns (address tokenAddress) {
        require(msg.value >= LAUNCH_FEE, "CultistLaunchpad: Insufficient fee");
        require(bytes(name).length > 0, "CultistLaunchpad: Empty name");
        require(bytes(symbol).length > 0, "CultistLaunchpad: Empty symbol");

        // Create the token
        LaunchedToken token = new LaunchedToken(
            name,
            symbol,
            imageUri,
            msg.sender,
            address(this)
        );
        tokenAddress = address(token);

        // Initialize token info
        tokens[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            tokensSold: 0,
            monadRaised: 0,
            virtualReserve: INITIAL_VIRTUAL_RESERVE,
            graduated: false,
            graduatedAt: 0,
            sellLocked: false,
            lockExpiry: 0,
            creatorBurnedForLock: 0
        });

        allTokens.push(tokenAddress);

        // Swap launch fee to CTHU and burn
        _swapAndBurn(LAUNCH_FEE);

        // Refund excess
        if (msg.value > LAUNCH_FEE) {
            payable(msg.sender).transfer(msg.value - LAUNCH_FEE);
        }

        emit TokenSummoned(tokenAddress, msg.sender, name, symbol, imageUri);
    }

    // ============ Bonding Curve Trading ============

    /**
     * @notice Buy tokens on the bonding curve
     * @param token Token address to buy
     */
    function buyTokens(address token) external payable nonReentrant {
        TokenInfo storage info = tokens[token];
        require(info.tokenAddress != address(0), "CultistLaunchpad: Token not found");
        require(!info.graduated, "CultistLaunchpad: Token graduated");
        require(msg.value > 0, "CultistLaunchpad: Zero amount");

        uint256 tokensOut = _calculateBuyAmount(info, msg.value);
        require(tokensOut > 0, "CultistLaunchpad: Zero tokens");
        require(info.tokensSold + tokensOut <= BONDING_CURVE_SUPPLY, "CultistLaunchpad: Exceeds supply");

        info.tokensSold += tokensOut;
        info.monadRaised += msg.value;
        info.virtualReserve += msg.value;

        // Transfer tokens to buyer
        IERC20(token).safeTransfer(msg.sender, tokensOut);

        emit TokenBought(token, msg.sender, msg.value, tokensOut);

        // Check for graduation
        if (_shouldGraduate(info)) {
            _graduate(info);
        }
    }

    /**
     * @notice Sell tokens back to the bonding curve
     * @param token Token address to sell
     * @param amount Amount of tokens to sell
     */
    function sellTokens(address token, uint256 amount) external nonReentrant {
        TokenInfo storage info = tokens[token];
        require(info.tokenAddress != address(0), "CultistLaunchpad: Token not found");
        require(!info.graduated, "CultistLaunchpad: Token graduated");
        require(!info.sellLocked || block.timestamp >= info.lockExpiry, "CultistLaunchpad: Sells locked");
        require(amount > 0, "CultistLaunchpad: Zero amount");

        uint256 monadOut = _calculateSellAmount(info, amount);
        require(monadOut > 0, "CultistLaunchpad: Zero MONAD");
        require(monadOut <= info.monadRaised, "CultistLaunchpad: Insufficient reserves");

        info.tokensSold -= amount;
        info.monadRaised -= monadOut;
        info.virtualReserve -= monadOut;

        // Transfer tokens from seller
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Send MONAD to seller
        payable(msg.sender).transfer(monadOut);

        emit TokenSold(token, msg.sender, amount, monadOut);
    }

    /**
     * @notice Calculate tokens received for MONAD input
     */
    function _calculateBuyAmount(TokenInfo storage info, uint256 monadIn) internal view returns (uint256) {
        // Exponential bonding curve: tokensOut = tokensSold * (1 - (virtualReserve / (virtualReserve + monadIn)))
        uint256 availableTokens = BONDING_CURVE_SUPPLY - info.tokensSold;
        if (availableTokens == 0) return 0;

        uint256 newVirtualReserve = info.virtualReserve + monadIn;
        uint256 tokensOut = (availableTokens * monadIn) / newVirtualReserve;

        return tokensOut > availableTokens ? availableTokens : tokensOut;
    }

    /**
     * @notice Calculate MONAD received for token input
     */
    function _calculateSellAmount(TokenInfo storage info, uint256 tokensIn) internal view returns (uint256) {
        if (info.tokensSold == 0) return 0;

        // Reverse of buy calculation
        uint256 monadOut = (info.virtualReserve * tokensIn) / (BONDING_CURVE_SUPPLY - info.tokensSold + tokensIn);

        return monadOut > info.monadRaised ? info.monadRaised : monadOut;
    }

    // ============ Graduation ============

    /**
     * @notice Check if token should graduate
     */
    function _shouldGraduate(TokenInfo storage info) internal view returns (bool) {
        // Graduate when MONAD raised reaches threshold
        // Note: In production, use price oracle for accurate USD conversion
        return info.monadRaised >= GRADUATION_THRESHOLD / 1e16; // Simplified: assumes ~$0.01879 MONAD
    }

    /**
     * @notice Graduate token to CthuSwap
     */
    function _graduate(TokenInfo storage info) internal {
        info.graduated = true;
        info.graduatedAt = block.timestamp;

        uint256 totalRaised = info.monadRaised;

        // Calculate distributions
        uint256 lpAmount = (totalRaised * LP_SHARE) / 10000;
        uint256 creatorAmount = (totalRaised * CREATOR_SHARE) / 10000;
        uint256 treasuryAmount = (totalRaised * TREASURY_SHARE) / 10000;
        uint256 cthuBuybackAmount = (totalRaised * CTHU_BUYBACK_SHARE) / 10000;
        uint256 cthuLpAmount = (totalRaised * CTHU_LP_SHARE) / 10000;

        // Send to creator
        payable(info.creator).transfer(creatorAmount);

        // Send to treasury
        payable(treasury).transfer(treasuryAmount);

        // CTHU buyback and burn
        _swapAndBurn(cthuBuybackAmount);

        // Add liquidity to CTHU/MONAD pair
        _addToCthuMonadLP(cthuLpAmount);

        // Create LP pair for graduated token
        address pair = _createGraduatedLP(info.tokenAddress, lpAmount);

        emit TokenGraduated(info.tokenAddress, totalRaised, pair);
    }

    /**
     * @notice Create LP for graduated token
     */
    function _createGraduatedLP(address token, uint256 monadAmount) internal returns (address pair) {
        // Approve router
        IERC20(token).approve(address(router), LIQUIDITY_SUPPLY);

        // Add liquidity
        router.addLiquidityMONAD{value: monadAmount}(
            token,
            LIQUIDITY_SUPPLY,
            0,
            0,
            BURN_ADDRESS, // Burn LP tokens
            block.timestamp + 300
        );

        pair = factory.getPair(token, wmonad);
    }

    /**
     * @notice Add to CTHU/MONAD LP
     */
    function _addToCthuMonadLP(uint256 monadAmount) internal {
        // Swap half to CTHU
        address[] memory path = new address[](2);
        path[0] = wmonad;
        path[1] = address(cthu);

        uint256[] memory amounts = router.swapExactMONADForTokens{value: monadAmount / 2}(
            0,
            path,
            address(this),
            block.timestamp + 300
        );

        uint256 cthuAmount = amounts[1];
        uint256 remainingMonad = monadAmount - (monadAmount / 2);

        // Approve and add liquidity
        cthu.approve(address(router), cthuAmount);
        router.addLiquidityMONAD{value: remainingMonad}(
            address(cthu),
            cthuAmount,
            0,
            0,
            BURN_ADDRESS,
            block.timestamp + 300
        );
    }

    /**
     * @notice Swap MONAD to CTHU and burn
     */
    function _swapAndBurn(uint256 monadAmount) internal {
        if (monadAmount == 0) return;

        address[] memory path = new address[](2);
        path[0] = wmonad;
        path[1] = address(cthu);

        router.swapExactMONADForTokens{value: monadAmount}(
            0,
            path,
            BURN_ADDRESS,
            block.timestamp + 300
        );
    }

    // ============ Sell Lock Mechanism ============

    /**
     * @notice Lock sells for a token
     * @param token Token address
     * @param durationDays Number of days to lock
     */
    function lockSells(address token, uint256 durationDays) external nonReentrant {
        TokenInfo storage info = tokens[token];
        require(info.tokenAddress != address(0), "CultistLaunchpad: Token not found");
        require(msg.sender == info.creator, "CultistLaunchpad: Not creator");
        require(!info.graduated, "CultistLaunchpad: Token graduated");
        require(durationDays > 0 && durationDays <= 30, "CultistLaunchpad: Invalid duration");

        uint256 cost = calculateLockCost(durationDays);

        // Transfer CTHU from creator
        cthu.safeTransferFrom(msg.sender, address(this), cost);

        // Burn 95%
        uint256 burnAmount = (cost * LOCK_BURN_PERCENT) / 100;
        cthu.safeTransfer(BURN_ADDRESS, burnAmount);

        // Treasury gets 5%
        uint256 treasuryAmount = cost - burnAmount;
        cthu.safeTransfer(treasury, treasuryAmount);

        info.sellLocked = true;
        info.lockExpiry = block.timestamp + (durationDays * 1 days);
        info.creatorBurnedForLock += cost;

        emit SellsLocked(token, durationDays, cost);
    }

    /**
     * @notice Force unlock sells (anyone can call)
     * @param token Token address
     */
    function forceUnlock(address token) external nonReentrant {
        TokenInfo storage info = tokens[token];
        require(info.tokenAddress != address(0), "CultistLaunchpad: Token not found");
        require(info.sellLocked, "CultistLaunchpad: Not locked");
        require(block.timestamp < info.lockExpiry, "CultistLaunchpad: Lock expired");

        uint256 unlockCost = info.creatorBurnedForLock * FORCE_UNLOCK_MULTIPLIER;

        // Transfer and burn 100%
        cthu.safeTransferFrom(msg.sender, BURN_ADDRESS, unlockCost);

        info.sellLocked = false;
        info.lockExpiry = 0;

        emit SellsUnlocked(token, msg.sender, unlockCost);
    }

    /**
     * @notice Calculate lock cost for duration
     * @param durationDays Number of days
     * @return cost Total CTHU cost
     */
    function calculateLockCost(uint256 durationDays) public pure returns (uint256 cost) {
        for (uint256 day = 1; day <= durationDays; day++) {
            // dailyCost = 10000 * (1.25 ^ (day - 1))
            uint256 dailyCost = LOCK_BASE_COST;
            for (uint256 i = 1; i < day; i++) {
                dailyCost = (dailyCost * LOCK_MULTIPLIER) / 100;
            }
            cost += dailyCost;
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get token price on bonding curve
     * @param token Token address
     * @return price Price per token in MONAD (scaled by 1e18)
     */
    function getTokenPrice(address token) external view returns (uint256 price) {
        TokenInfo storage info = tokens[token];
        if (info.tokenAddress == address(0)) return 0;
        if (info.graduated) return 0;

        uint256 availableTokens = BONDING_CURVE_SUPPLY - info.tokensSold;
        if (availableTokens == 0) return type(uint256).max;

        price = (info.virtualReserve * 1e18) / availableTokens;
    }

    /**
     * @notice Get graduation progress
     * @param token Token address
     * @return raised MONAD raised
     * @return threshold Graduation threshold
     * @return progress Progress percentage (0-100)
     */
    function getGraduationProgress(address token) external view returns (
        uint256 raised,
        uint256 threshold,
        uint256 progress
    ) {
        TokenInfo storage info = tokens[token];
        raised = info.monadRaised;
        threshold = GRADUATION_THRESHOLD / 1e16; // Simplified threshold
        progress = (raised * 100) / threshold;
        if (progress > 100) progress = 100;
    }

    /**
     * @notice Check if token is graduated
     */
    function isGraduated(address token) external view returns (bool) {
        return tokens[token].graduated;
    }

    /**
     * @notice Check if sells are locked
     */
    function isSellLocked(address token) external view returns (bool) {
        TokenInfo storage info = tokens[token];
        return info.sellLocked && block.timestamp < info.lockExpiry;
    }

    /**
     * @notice Get lock info for a token
     */
    function getLockInfo(address token) external view returns (
        bool locked,
        uint256 expiry,
        uint256 creatorBurned,
        uint256 unlockCost
    ) {
        TokenInfo storage info = tokens[token];
        locked = info.sellLocked && block.timestamp < info.lockExpiry;
        expiry = info.lockExpiry;
        creatorBurned = info.creatorBurnedForLock;
        unlockCost = creatorBurned * FORCE_UNLOCK_MULTIPLIER;
    }

    /**
     * @notice Get all launched tokens
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @notice Get number of launched tokens
     */
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    // ============ Receive MONAD ============

    receive() external payable {}
}
