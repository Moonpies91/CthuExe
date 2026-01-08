// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTHUCOIN.sol";
import "../src/dex/CthuFactory.sol";
import "../src/dex/CthuRouter.sol";
import "../src/dex/CthuPair.sol";
import "../src/dex/WMONAD.sol";
import "../src/farm/CthuFarm.sol";
import "../src/launchpad/CultistLaunchpad.sol";
import "../src/leaderboard/Leaderboard.sol";

/**
 * @title Deploy
 * @notice Deployment script for the cthu.nad ecosystem on Monad
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
 *
 * IMPORTANT SAFEGUARDS:
 * - Farm pools are added BEFORE finalization
 * - StartTime is configurable and set after pools are added
 * - Finalization requires pools to exist
 * - All critical steps happen atomically in one transaction
 *
 * Deployment Order:
 * 1. WMONAD (if not already deployed)
 * 2. CthuFarm (deploy first to get address for CTHU)
 * 3. CTHUCOIN (with farm address)
 * 4. Configure farm pools + set start time + finalize (ATOMIC)
 * 5. CthuFactory
 * 6. CthuRouter
 * 7. Create CTHU/MONAD pair
 * 8. Leaderboard
 * 9. CultistLaunchpad
 * 10. Add initial liquidity
 */
contract DeployScript is Script {
    // Deployment addresses
    WMONAD public wmonad;
    CTHUCOIN public cthu;
    CthuFactory public factory;
    CthuRouter public router;
    CthuFarm public farm;
    CultistLaunchpad public launchpad;
    Leaderboard public leaderboard;
    address public cthuMonadPair;

    // Configuration
    address public devWallet;
    address public treasury;

    // Constants
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Pool allocation points (must sum to 10000)
    uint256 constant POOL_CTHU_MONAD_ALLOC = 5500;  // 55%
    uint256 constant POOL_CTHU_USDT_ALLOC = 2800;   // 28%
    uint256 constant POOL_MONAD_USDT_ALLOC = 1700;  // 17%

    function setUp() public {
        // Load environment variables
        devWallet = vm.envAddress("DEV_WALLET_ADDRESS");
        treasury = vm.envAddress("TREASURY_ADDRESS");
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("  DEPLOYING cthu.nad ECOSYSTEM");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Dev Wallet:", devWallet);
        console.log("Treasury:", treasury);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ============ PHASE 1: Deploy Core Contracts ============
        console.log("=== PHASE 1: Deploy Core Contracts ===");

        // 1. Deploy WMONAD
        wmonad = new WMONAD();
        console.log("[1] WMONAD deployed at:", address(wmonad));

        // 2. Deploy CthuFarm (no startTime in constructor - configurable)
        // We need the farm address for CTHU, but CTHU address for farm
        // Solution: Deploy CTHU first with deployer as farm, then transfer to actual farm

        // 3. Deploy CTHUCOIN - deployer receives farm allocation temporarily
        cthu = new CTHUCOIN(devWallet, deployer);
        console.log("[2] CTHUCOIN (cthu.nad) deployed at:", address(cthu));

        // 4. Deploy CthuFarm with new constructor (only takes CTHU address)
        farm = new CthuFarm(address(cthu));
        console.log("[3] CthuFarm deployed at:", address(farm));

        // 5. Transfer farm allocation from deployer to farm contract
        uint256 farmAllocation = cthu.FARM_ALLOCATION();
        cthu.transfer(address(farm), farmAllocation);
        console.log("[4] Transferred", farmAllocation / 1e18, "CTHU to farm");

        // ============ PHASE 2: Configure Farm (ATOMIC - CRITICAL) ============
        console.log("");
        console.log("=== PHASE 2: Configure Farm (ATOMIC) ===");

        // 6. Deploy Factory FIRST so we can create the LP pair for pool 0
        factory = new CthuFactory(
            treasury,        // feeTo
            address(cthu),   // cthu token
            BURN_ADDRESS,    // burn address
            treasury         // staking rewards
        );
        console.log("[5] CthuFactory deployed at:", address(factory));

        // 7. Deploy Router
        router = new CthuRouter(address(factory), address(wmonad));
        console.log("[6] CthuRouter deployed at:", address(router));

        // 8. Create CTHU/MONAD pair for Pool 0
        cthuMonadPair = factory.createPair(address(cthu), address(wmonad));
        console.log("[7] CTHU/MONAD pair created at:", cthuMonadPair);

        // 9. Add Pool 0: CTHU/MONAD LP (55% weight)
        farm.addPool(cthuMonadPair, POOL_CTHU_MONAD_ALLOC);
        console.log("[8] Added Pool 0: CTHU/MONAD LP (55%)");

        // Note: Pool 1 & 2 require USDT which may not be deployed yet
        // For mainnet, we can add these pools before finalization
        // For now, we have at least 1 pool which allows finalization

        // 10. Set farm start time (1 hour from now)
        uint256 farmStartTime = block.timestamp + 1 hours;
        farm.setStartTime(farmStartTime);
        console.log("[9] Farm start time set to:", farmStartTime);

        // 11. FINALIZE the farm - locks pools and start time
        farm.finalizeStartTime();
        console.log("[10] Farm FINALIZED with", farm.poolLength(), "pool(s)");

        // Verify farm is properly configured
        (bool isReady, uint256 poolCount, bool startTimeSet, bool isFinalized) = farm.getConfigurationStatus();
        require(isFinalized, "CRITICAL: Farm not finalized!");
        require(poolCount > 0, "CRITICAL: No pools configured!");
        console.log("");
        console.log("=== FARM VERIFICATION ===");
        console.log("Pool count:", poolCount);
        console.log("Start time set:", startTimeSet);
        console.log("Finalized:", isFinalized);

        // ============ PHASE 3: Deploy Supporting Contracts ============
        console.log("");
        console.log("=== PHASE 3: Deploy Supporting Contracts ===");

        // 12. Deploy Leaderboard
        leaderboard = new Leaderboard(address(cthu));
        console.log("[11] Leaderboard deployed at:", address(leaderboard));

        // 13. Deploy CultistLaunchpad
        launchpad = new CultistLaunchpad(
            address(cthu),
            address(factory),
            address(router),
            treasury,
            address(wmonad)
        );
        console.log("[12] CultistLaunchpad deployed at:", address(launchpad));

        vm.stopBroadcast();

        // ============ DEPLOYMENT SUMMARY ============
        console.log("");
        console.log("========================================");
        console.log("  DEPLOYMENT COMPLETE");
        console.log("========================================");
        console.log("WMONAD:           ", address(wmonad));
        console.log("CTHUCOIN (cthu.nad):", address(cthu));
        console.log("CthuFactory:      ", address(factory));
        console.log("CthuRouter:       ", address(router));
        console.log("CthuFarm:         ", address(farm));
        console.log("CTHU/MONAD Pair:  ", cthuMonadPair);
        console.log("Leaderboard:      ", address(leaderboard));
        console.log("CultistLaunchpad: ", address(launchpad));
        console.log("");
        console.log("=== FARM STATUS ===");
        console.log("Start Time:       ", farm.startTime());
        console.log("End Time:         ", farm.endTime());
        console.log("Pools:            ", farm.poolLength());
        console.log("Finalized:        ", farm.startTimeFinalized());
        console.log("CTHU Balance:     ", cthu.balanceOf(address(farm)) / 1e18);
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Add initial liquidity to CTHU/MONAD pair");
        console.log("2. Verify contracts on explorer");
        console.log("3. Update frontend with new addresses");
        console.log("");
        console.log("=== IMPORTANT ===");
        console.log("Farm will start accepting deposits immediately.");
        console.log("Rewards will begin at start time:", farm.startTime());
    }

    function computeCreateAddress(address deployer, uint256 nonce) internal pure override returns (address) {
        bytes memory data;
        if (nonce == 0x00) {
            data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, bytes1(0x80));
        } else if (nonce <= 0x7f) {
            data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, uint8(nonce));
        } else if (nonce <= 0xff) {
            data = abi.encodePacked(bytes1(0xd7), bytes1(0x94), deployer, bytes1(0x81), uint8(nonce));
        } else if (nonce <= 0xffff) {
            data = abi.encodePacked(bytes1(0xd8), bytes1(0x94), deployer, bytes1(0x82), uint16(nonce));
        } else if (nonce <= 0xffffff) {
            data = abi.encodePacked(bytes1(0xd9), bytes1(0x94), deployer, bytes1(0x83), uint24(nonce));
        } else {
            data = abi.encodePacked(bytes1(0xda), bytes1(0x94), deployer, bytes1(0x84), uint32(nonce));
        }
        return address(uint160(uint256(keccak256(data))));
    }
}
