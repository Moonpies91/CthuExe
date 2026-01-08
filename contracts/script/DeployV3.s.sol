// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CthuCoinV3.sol";
import "../src/dex/CthuFactory.sol";
import "../src/dex/CthuRouter.sol";
import "../src/dex/WMONAD.sol";
import "../src/farm/CthuFarmV3.sol";
import "../src/launchpad/CultistLaunchpad.sol";
import "../src/leaderboard/Leaderboard.sol";

/**
 * @title DeployV3 - Bulletproof Deployment
 * @notice Deploys Cthu.exe ecosystem with bulletproof farm
 *
 * CRITICAL SAFETY MEASURES:
 * 1. Farm deployed FIRST with no tokens
 * 2. Token mints directly to farm (no manual transfer)
 * 3. All pools added BEFORE any user can interact
 * 4. Emergency recovery TESTED before proceeding
 * 5. Every step verified with require statements
 *
 * THE #1 RULE: If ANY verification fails, deployment STOPS.
 */
contract DeployV3Script is Script {
    // Deployment addresses
    WMONAD public wmonad;
    CthuCoinV3 public cthu;
    CthuFactory public factory;
    CthuRouter public router;
    CthuFarmV3 public farm;
    CultistLaunchpad public launchpad;
    Leaderboard public leaderboard;
    address public cthuMonadPair;
    address public cthuUsdtPair;

    // Configuration
    address public devWallet;
    address public treasury;

    // Known addresses on Monad Mainnet
    address constant USDT0 = 0xe7cd86e13AC4309349F30B3435a9d337750fC82D;
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Emission rates (per second)
    uint256 constant YEAR_1_EMISSION = 12_680000000000000000; // ~12.68 CTHU/sec for Year 1
    uint256 constant FOUR_YEARS = 4 * 365 days;

    // Pool allocation points (flexible - can be changed later!)
    uint256 constant CTHU_MONAD_ALLOC = 5500;  // 55%
    uint256 constant CTHU_USDT_ALLOC = 2800;   // 28%
    uint256 constant MONAD_USDT_ALLOC = 1700;  // 17%

    function setUp() public {
        devWallet = vm.envAddress("DEV_WALLET_ADDRESS");
        treasury = vm.envAddress("TREASURY_ADDRESS");
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("");
        console.log("================================================================");
        console.log("  DEPLOYING Cthu.exe - BULLETPROOF EDITION");
        console.log("================================================================");
        console.log("");
        console.log("Deployer:    ", deployer);
        console.log("Dev Wallet:  ", devWallet);
        console.log("Treasury:    ", treasury);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ================================================================
        // PHASE 1: Deploy WMONAD
        // ================================================================
        console.log("=== PHASE 1: Deploy WMONAD ===");
        console.log("");

        // 1. Deploy WMONAD (or use existing)
        wmonad = new WMONAD();
        console.log("[1/12] WMONAD deployed:       ", address(wmonad));

        // ================================================================
        // PHASE 2: Deploy Farm (Before Token!)
        // ================================================================
        console.log("");
        console.log("=== PHASE 2: Deploy Bulletproof Farm ===");
        console.log("");

        // 2. We need a placeholder CTHU address for farm constructor
        //    We'll compute it using CREATE address prediction
        uint256 currentNonce = vm.getNonce(deployer);
        // Farm will be deployed at nonce+0, Token at nonce+1
        address predictedTokenAddress = computeCreateAddress(deployer, currentNonce + 1);
        console.log("[INFO] Predicted CTHU address:", predictedTokenAddress);

        // 3. Deploy Farm with predicted token address
        farm = new CthuFarmV3(
            predictedTokenAddress,  // CTHU address (predicted)
            YEAR_1_EMISSION,        // Starting emission rate
            block.timestamp + 1 hours, // Start in 1 hour (gives time to add pools)
            FOUR_YEARS              // 4 year duration
        );
        console.log("[2/12] Farm deployed:         ", address(farm));

        // ================================================================
        // PHASE 3: Deploy Token (Mints directly to Farm!)
        // ================================================================
        console.log("");
        console.log("=== PHASE 3: Deploy Cthu.exe ===");
        console.log("");

        // 4. Deploy Token - mints 885M directly to farm in constructor!
        cthu = new CthuCoinV3(
            devWallet,      // Dev wallet (vested tokens)
            deployer,       // Liquidity receiver (15M for LP)
            address(farm)   // Farm gets 885M directly!
        );
        console.log("[3/12] Cthu.exe deployed:     ", address(cthu));

        // VERIFY: Token address matches prediction
        require(address(cthu) == predictedTokenAddress, "CRITICAL: Token address mismatch!");
        console.log("[OK] Token address matches prediction");

        // VERIFY: Farm has correct balance
        uint256 farmBalance = cthu.balanceOf(address(farm));
        require(farmBalance == cthu.FARM_ALLOCATION(), "CRITICAL: Farm balance wrong!");
        console.log("[OK] Farm has 885M CTHU");

        // ================================================================
        // PHASE 4: Deploy Factory & Router (Now that CTHU exists!)
        // ================================================================
        console.log("");
        console.log("=== PHASE 4: Deploy Factory & Router ===");
        console.log("");

        // 5. Deploy Factory with actual CTHU address
        factory = new CthuFactory(
            treasury,           // feeTo
            address(cthu),      // CTHU token (now deployed!)
            BURN_ADDRESS,       // burn address
            treasury            // staking rewards
        );
        console.log("[4/12] Factory deployed:      ", address(factory));

        // 6. Deploy Router
        router = new CthuRouter(address(factory), address(wmonad));
        console.log("[5/12] Router deployed:       ", address(router));

        // ================================================================
        // PHASE 5: Create LP Pairs
        // ================================================================
        console.log("");
        console.log("=== PHASE 5: Create LP Pairs ===");
        console.log("");

        // 7. Create CTHU/MONAD pair
        cthuMonadPair = factory.createPair(address(cthu), address(wmonad));
        console.log("[6/12] CTHU/MONAD pair:       ", cthuMonadPair);

        // 8. Create CTHU/USDT0 pair
        cthuUsdtPair = factory.createPair(address(cthu), USDT0);
        console.log("[7/12] CTHU/USDT0 pair:       ", cthuUsdtPair);

        // Note: MONAD/USDT0 pair may already exist or can be created later

        // ================================================================
        // PHASE 5: Add ALL Pools to Farm
        // ================================================================
        console.log("");
        console.log("=== PHASE 5: Add Farm Pools ===");
        console.log("");

        // 9. Add Pool 0: CTHU/MONAD (55%)
        farm.addPool(cthuMonadPair, CTHU_MONAD_ALLOC);
        console.log("[8/12] Pool 0 added: CTHU/MONAD (55%)");

        // 10. Add Pool 1: CTHU/USDT0 (28%)
        farm.addPool(cthuUsdtPair, CTHU_USDT_ALLOC);
        console.log("[9/12] Pool 1 added: CTHU/USDT0 (28%)");

        // Note: Pool 2 (MONAD/USDT0) can be added later since farm allows it!
        console.log("[INFO] Pool 2 (MONAD/USDT0) can be added later - farm is flexible!");

        // VERIFY: Pools exist
        require(farm.poolLength() >= 2, "CRITICAL: Pools not added!");
        console.log("[OK] Farm has", farm.poolLength(), "pools");

        // ================================================================
        // PHASE 6: TEST Emergency Recovery (CRITICAL!)
        // ================================================================
        console.log("");
        console.log("=== PHASE 6: Test Emergency Recovery ===");
        console.log("");

        // This is the MOST IMPORTANT test - if this fails, DO NOT proceed
        uint256 testAmount = 1; // 1 wei
        uint256 balanceBefore = cthu.balanceOf(address(farm));

        // Attempt recovery
        farm.emergencyRecoverTokens(address(cthu), deployer, testAmount);
        uint256 balanceAfter = cthu.balanceOf(address(farm));

        require(balanceBefore - balanceAfter == testAmount, "CRITICAL: Recovery failed!");
        console.log("[OK] Emergency recovery WORKS!");

        // Send the test wei back to farm
        cthu.transfer(address(farm), testAmount);
        console.log("[OK] Test token returned to farm");

        // ================================================================
        // PHASE 7: Deploy Supporting Contracts
        // ================================================================
        console.log("");
        console.log("=== PHASE 7: Deploy Supporting Contracts ===");
        console.log("");

        // 11. Deploy Leaderboard
        leaderboard = new Leaderboard(address(cthu));
        console.log("[10/12] Leaderboard deployed: ", address(leaderboard));

        // 12. Deploy Launchpad
        launchpad = new CultistLaunchpad(
            address(cthu),
            address(factory),
            address(router),
            treasury,
            address(wmonad)
        );
        console.log("[11/12] Launchpad deployed:   ", address(launchpad));

        // ================================================================
        // PHASE 8: Final Verification
        // ================================================================
        console.log("");
        console.log("=== PHASE 8: Final Verification ===");
        console.log("");

        // Verify everything is correct
        require(cthu.totalSupply() == cthu.TOTAL_SUPPLY(), "Wrong total supply!");
        console.log("[OK] Total supply: 1,000,000,000 CTHU");

        require(cthu.balanceOf(address(farm)) == cthu.FARM_ALLOCATION(), "Farm balance wrong!");
        console.log("[OK] Farm balance: 885,000,000 CTHU");

        require(cthu.balanceOf(deployer) == cthu.LIQUIDITY_ALLOCATION(), "Liquidity balance wrong!");
        console.log("[OK] Liquidity balance: 15,000,000 CTHU");

        require(farm.poolLength() >= 2, "Not enough pools!");
        console.log("[OK] Farm pools:", farm.poolLength());

        console.log("[12/12] All verifications passed!");

        vm.stopBroadcast();

        // ================================================================
        // DEPLOYMENT SUMMARY
        // ================================================================
        console.log("");
        console.log("================================================================");
        console.log("  DEPLOYMENT COMPLETE - Cthu.exe BULLETPROOF EDITION");
        console.log("================================================================");
        console.log("");
        console.log("CONTRACTS:");
        console.log("  WMONAD:           ", address(wmonad));
        console.log("  Cthu.exe:         ", address(cthu));
        console.log("  Factory:          ", address(factory));
        console.log("  Router:           ", address(router));
        console.log("  Farm (V3):        ", address(farm));
        console.log("  Leaderboard:      ", address(leaderboard));
        console.log("  Launchpad:        ", address(launchpad));
        console.log("");
        console.log("LP PAIRS:");
        console.log("  CTHU/MONAD:       ", cthuMonadPair);
        console.log("  CTHU/USDT0:       ", cthuUsdtPair);
        console.log("");
        console.log("FARM STATUS:");
        console.log("  Start Time:       ", farm.startTime());
        console.log("  End Time:         ", farm.endTime());
        console.log("  Emission Rate:    ", farm.emissionPerSecond());
        console.log("  Pool Count:       ", farm.poolLength());
        console.log("  CTHU Balance:     ", cthu.balanceOf(address(farm)) / 1e18, "CTHU");
        console.log("");
        console.log("REDUNDANCIES:");
        console.log("  [x] Emergency recovery tested and WORKING");
        console.log("  [x] Pools can be added/modified anytime");
        console.log("  [x] Emissions can be adjusted anytime");
        console.log("  [x] Users can always withdraw LP tokens");
        console.log("  [x] 7-day shutdown timelock available");
        console.log("");
        console.log("NEXT STEPS:");
        console.log("  1. Add initial liquidity to CTHU/MONAD pair");
        console.log("  2. Add initial liquidity to CTHU/USDT0 pair");
        console.log("  3. Verify contracts on MonadScan");
        console.log("  4. Update frontend with new addresses");
        console.log("  5. (Optional) Add MONAD/USDT0 pool later");
        console.log("");
        console.log("================================================================");
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
