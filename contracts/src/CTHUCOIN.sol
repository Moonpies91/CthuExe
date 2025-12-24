// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CTHUCOIN
 * @notice The native token of the CthuCoin ecosystem
 * @dev ERC-20 token with 1B supply, vesting for dev allocation, and burn mechanics
 *
 * Distribution:
 * - 15,000,000 (1.5%) to deployer for initial liquidity
 * - 100,000,000 (10%) to dev wallet with 12-month linear vesting
 * - 885,000,000 (88.5%) to farming contract for rewards
 */
contract CTHUCOIN is ERC20, ERC20Burnable, ReentrancyGuard {
    // ============ Constants ============

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion
    uint256 public constant INITIAL_LIQUIDITY = 15_000_000 * 10**18; // 15 million
    uint256 public constant DEV_ALLOCATION = 100_000_000 * 10**18; // 100 million
    uint256 public constant FARM_ALLOCATION = 885_000_000 * 10**18; // 885 million

    uint256 public constant VESTING_DURATION = 365 days; // 12 months

    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ============ State Variables ============

    address public immutable devWallet;
    address public immutable farmContract;

    uint256 public immutable vestingStart;
    uint256 public devTokensClaimed;

    // ============ Events ============

    event DevTokensClaimed(address indexed devWallet, uint256 amount);
    event TokensBurned(address indexed burner, uint256 amount);

    // ============ Constructor ============

    /**
     * @notice Deploys the CTHUCOIN token with initial distribution
     * @param _devWallet Address to receive vested dev tokens
     * @param _farmContract Address of the farming contract to receive farm allocation
     */
    constructor(
        address _devWallet,
        address _farmContract
    ) ERC20("CthuCoin", "CTHU") {
        require(_devWallet != address(0), "CTHU: Invalid dev wallet");
        require(_farmContract != address(0), "CTHU: Invalid farm contract");

        devWallet = _devWallet;
        farmContract = _farmContract;
        vestingStart = block.timestamp;

        // Mint initial liquidity to deployer
        _mint(msg.sender, INITIAL_LIQUIDITY);

        // Mint farm allocation directly to farm contract
        _mint(_farmContract, FARM_ALLOCATION);

        // Dev allocation is held in contract and vested
        _mint(address(this), DEV_ALLOCATION);
    }

    // ============ Vesting Functions ============

    /**
     * @notice Returns the amount of dev tokens that can be claimed
     * @return claimable The amount of tokens available to claim
     */
    function claimableDevTokens() public view returns (uint256 claimable) {
        uint256 elapsed = block.timestamp - vestingStart;

        if (elapsed >= VESTING_DURATION) {
            // Vesting complete, all remaining tokens claimable
            claimable = DEV_ALLOCATION - devTokensClaimed;
        } else {
            // Linear vesting
            uint256 totalVested = (DEV_ALLOCATION * elapsed) / VESTING_DURATION;
            claimable = totalVested - devTokensClaimed;
        }
    }

    /**
     * @notice Claims vested dev tokens
     * @dev Only callable by the dev wallet
     */
    function claimDevTokens() external nonReentrant {
        require(msg.sender == devWallet, "CTHU: Not dev wallet");

        uint256 claimable = claimableDevTokens();
        require(claimable > 0, "CTHU: Nothing to claim");

        devTokensClaimed += claimable;
        _transfer(address(this), devWallet, claimable);

        emit DevTokensClaimed(devWallet, claimable);
    }

    // ============ Burn Functions ============

    /**
     * @notice Burns tokens by sending them to the burn address
     * @param amount The amount of tokens to burn
     */
    function burnToDead(uint256 amount) external {
        _transfer(msg.sender, BURN_ADDRESS, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Returns the total amount of tokens burned (sent to dead address)
     * @return The balance of the burn address
     */
    function totalBurned() external view returns (uint256) {
        return balanceOf(BURN_ADDRESS);
    }

    // ============ View Functions ============

    /**
     * @notice Returns vesting information
     * @return start The timestamp when vesting started
     * @return duration The total vesting duration
     * @return claimed The amount of dev tokens already claimed
     * @return remaining The amount of dev tokens not yet claimed
     */
    function vestingInfo() external view returns (
        uint256 start,
        uint256 duration,
        uint256 claimed,
        uint256 remaining
    ) {
        start = vestingStart;
        duration = VESTING_DURATION;
        claimed = devTokensClaimed;
        remaining = DEV_ALLOCATION - devTokensClaimed;
    }
}
