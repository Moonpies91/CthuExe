// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Cthu.exe - Terminal Edition
 * @notice The third iteration of CthuCoin - this time with bulletproof farming
 * @dev ERC20 token with fixed supply and vesting for dev allocation
 *
 *   ██████╗████████╗██╗  ██╗██╗   ██╗   ███████╗██╗  ██╗███████╗
 *  ██╔════╝╚══██╔══╝██║  ██║██║   ██║   ██╔════╝╚██╗██╔╝██╔════╝
 *  ██║        ██║   ███████║██║   ██║   █████╗   ╚███╔╝ █████╗
 *  ██║        ██║   ██╔══██║██║   ██║   ██╔══╝   ██╔██╗ ██╔══╝
 *  ╚██████╗   ██║   ██║  ██║╚██████╔╝██╗███████╗██╔╝ ██╗███████╗
 *   ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝
 *
 * Token Distribution:
 * - 885,000,000 CTHU (88.5%) → Farm rewards over 4 years
 * - 100,000,000 CTHU (10%)   → Dev allocation (1-year linear vest)
 * - 15,000,000 CTHU (1.5%)   → Initial liquidity
 *
 * Total Supply: 1,000,000,000 CTHU
 */
contract CthuCoinV3 is ERC20 {

    // ============ Constants ============

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;     // 1 billion
    uint256 public constant FARM_ALLOCATION = 885_000_000 * 10**18;    // 885 million (88.5%)
    uint256 public constant DEV_ALLOCATION = 100_000_000 * 10**18;     // 100 million (10%)
    uint256 public constant LIQUIDITY_ALLOCATION = 15_000_000 * 10**18; // 15 million (1.5%)

    uint256 public constant VESTING_DURATION = 365 days;

    // ============ State Variables ============

    address public immutable devWallet;
    uint256 public immutable vestingStart;
    uint256 public devClaimed;

    // ============ Events ============

    event DevTokensClaimed(address indexed to, uint256 amount);

    // ============ Constructor ============

    /**
     * @notice Deploy Cthu.exe
     * @param _devWallet Address for dev allocation (vested)
     * @param _liquidityReceiver Address to receive liquidity allocation
     * @param _farmAddress Address of the farm contract to receive farm allocation
     */
    constructor(
        address _devWallet,
        address _liquidityReceiver,
        address _farmAddress
    ) ERC20("Cthu.exe", "CTHU") {
        require(_devWallet != address(0), "Invalid dev wallet");
        require(_liquidityReceiver != address(0), "Invalid liquidity receiver");
        require(_farmAddress != address(0), "Invalid farm address");

        devWallet = _devWallet;
        vestingStart = block.timestamp;

        // Mint allocations
        _mint(_farmAddress, FARM_ALLOCATION);           // 885M to farm
        _mint(_liquidityReceiver, LIQUIDITY_ALLOCATION); // 15M for liquidity
        _mint(address(this), DEV_ALLOCATION);            // 100M held for vesting
    }

    // ============ Vesting Functions ============

    /**
     * @notice Calculate vested amount available to claim
     * @return Amount of tokens available to claim
     */
    function vestedAmount() public view returns (uint256) {
        uint256 elapsed = block.timestamp - vestingStart;

        if (elapsed >= VESTING_DURATION) {
            return DEV_ALLOCATION;
        }

        return (DEV_ALLOCATION * elapsed) / VESTING_DURATION;
    }

    /**
     * @notice Claim vested dev tokens
     */
    function claimDevTokens() external {
        require(msg.sender == devWallet, "Not dev wallet");

        uint256 vested = vestedAmount();
        uint256 claimable = vested - devClaimed;
        require(claimable > 0, "Nothing to claim");

        devClaimed += claimable;
        _transfer(address(this), devWallet, claimable);

        emit DevTokensClaimed(devWallet, claimable);
    }

    /**
     * @notice Get claimable amount for dev wallet
     * @return Amount currently claimable
     */
    function claimableDevTokens() external view returns (uint256) {
        return vestedAmount() - devClaimed;
    }

    /**
     * @notice Get vesting progress percentage (basis points)
     * @return Progress in basis points (10000 = 100%)
     */
    function vestingProgress() external view returns (uint256) {
        uint256 elapsed = block.timestamp - vestingStart;
        if (elapsed >= VESTING_DURATION) return 10000;
        return (elapsed * 10000) / VESTING_DURATION;
    }
}
