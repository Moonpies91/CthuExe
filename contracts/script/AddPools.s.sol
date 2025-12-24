// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/farm/CthuFarm.sol";

/**
 * @title AddPools
 * @notice Script to add farming pools to CthuFarm
 * @dev Run with: forge script script/AddPools.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Pool Configuration (must be run BEFORE farming starts):
 * - Pool 0: CTHU/MONAD LP - 50% (5000 points)
 * - Pool 1: CTHU/USDT LP - 25% (2500 points)
 * - Pool 2: MONAD/USDT LP - 15% (1500 points)
 * - Pool 3: Graduated tokens - 10% (1000 points)
 */
contract AddPoolsScript is Script {
    // Contract addresses (set from environment)
    address public farmAddress;
    address public cthuMonadLpAddress;
    address public cthuUsdtLpAddress;
    address public monadUsdtLpAddress;
    address public graduatedPoolAddress; // Placeholder for graduated token rewards

    // Pool allocation points
    uint256 constant CTHU_MONAD_ALLOC = 5000;  // 50%
    uint256 constant CTHU_USDT_ALLOC = 2500;   // 25%
    uint256 constant MONAD_USDT_ALLOC = 1500;  // 15%
    uint256 constant GRADUATED_ALLOC = 1000;   // 10%

    function setUp() public {
        farmAddress = vm.envAddress("FARM_ADDRESS");
        cthuMonadLpAddress = vm.envAddress("CTHU_MONAD_LP_ADDRESS");

        // These may not exist at initial deployment
        cthuUsdtLpAddress = vm.envOr("CTHU_USDT_LP_ADDRESS", address(0));
        monadUsdtLpAddress = vm.envOr("MONAD_USDT_LP_ADDRESS", address(0));
        graduatedPoolAddress = vm.envOr("GRADUATED_POOL_ADDRESS", address(0));
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        CthuFarm farm = CthuFarm(farmAddress);

        console.log("Adding farming pools...");
        console.log("Farm address:", farmAddress);
        console.log("Farm start time:", farm.startTime());
        console.log("Current time:", block.timestamp);

        require(block.timestamp < farm.startTime(), "Farming already started - cannot add pools");

        vm.startBroadcast(deployerPrivateKey);

        // Add Pool 0: CTHU/MONAD LP (required)
        require(cthuMonadLpAddress != address(0), "CTHU/MONAD LP address required");
        farm.addPool(cthuMonadLpAddress, CTHU_MONAD_ALLOC);
        console.log("Added Pool 0: CTHU/MONAD LP with", CTHU_MONAD_ALLOC, "points");

        // Add Pool 1: CTHU/USDT LP (optional - add placeholder if not available)
        if (cthuUsdtLpAddress != address(0)) {
            farm.addPool(cthuUsdtLpAddress, CTHU_USDT_ALLOC);
            console.log("Added Pool 1: CTHU/USDT LP with", CTHU_USDT_ALLOC, "points");
        } else {
            console.log("Skipping Pool 1: CTHU/USDT LP - address not provided");
        }

        // Add Pool 2: MONAD/USDT LP (optional)
        if (monadUsdtLpAddress != address(0)) {
            farm.addPool(monadUsdtLpAddress, MONAD_USDT_ALLOC);
            console.log("Added Pool 2: MONAD/USDT LP with", MONAD_USDT_ALLOC, "points");
        } else {
            console.log("Skipping Pool 2: MONAD/USDT LP - address not provided");
        }

        // Add Pool 3: Graduated tokens (optional)
        if (graduatedPoolAddress != address(0)) {
            farm.addPool(graduatedPoolAddress, GRADUATED_ALLOC);
            console.log("Added Pool 3: Graduated tokens with", GRADUATED_ALLOC, "points");
        } else {
            console.log("Skipping Pool 3: Graduated tokens - address not provided");
        }

        vm.stopBroadcast();

        console.log("\n=== POOLS CONFIGURED ===");
        console.log("Total pools:", farm.poolLength());
    }
}
