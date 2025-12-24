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
 * @notice Deployment script for the CthuCoin ecosystem
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Deployment Order:
 * 1. WMONAD (if not already deployed)
 * 2. CthuFarm (deploy first to get address for CTHU)
 * 3. CTHUCOIN (with farm address)
 * 4. CthuFactory
 * 5. CthuRouter
 * 6. Leaderboard
 * 7. CultistLaunchpad
 * 8. Configure farm pools
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

    // Configuration
    address public devWallet;
    address public treasury;

    // Constants
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    function setUp() public {
        // Load environment variables
        devWallet = vm.envAddress("DEV_WALLET_ADDRESS");
        treasury = vm.envAddress("TREASURY_ADDRESS");
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying CthuCoin ecosystem...");
        console.log("Deployer:", deployer);
        console.log("Dev Wallet:", devWallet);
        console.log("Treasury:", treasury);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WMONAD
        wmonad = new WMONAD();
        console.log("WMONAD deployed at:", address(wmonad));

        // 2. Deploy CthuFarm (need address for CTHU constructor)
        // Farm starts 1 hour from now
        uint256 farmStartTime = block.timestamp + 1 hours;

        // We need to predict the CTHU address or deploy farm after CTHU
        // For simplicity, deploy CTHU first with a placeholder, then update

        // Actually, let's deploy in correct order:
        // First compute the farm address using CREATE2 or deploy farm with placeholder

        // Deploy farm with placeholder CTHU (will fail validation)
        // Instead, let's use a two-step deployment

        // Step 2a: Compute future farm address
        bytes memory farmBytecode = abi.encodePacked(
            type(CthuFarm).creationCode,
            abi.encode(address(1), farmStartTime) // placeholder
        );
        address predictedFarm = computeCreateAddress(deployer, vm.getNonce(deployer) + 1);

        // 3. Deploy CTHUCOIN with predicted farm address
        // Note: In production, use CREATE2 for deterministic addresses
        // For now, deploy farm first with a dummy token, then redeploy

        // Simplified approach: Deploy CTHU first, then Farm
        // The farm will receive tokens in its constructor indirectly

        // Deploy CTHU (farm tokens minted to a temporary holder)
        // Actually the CTHU constructor mints to farm, so we need farm address first

        // Two-phase deployment:
        // Phase 1: Deploy all contracts
        // Phase 2: Initialize with correct addresses

        // Let's use a simpler approach - deploy farm with deployer as temporary CTHU
        // Then redeploy properly

        // SIMPLE APPROACH: Deploy everything, fund farm manually

        // 3. Deploy CTHUCOIN
        // For initial deployment, use deployer as farm to receive farm tokens
        // Then transfer to actual farm
        cthu = new CTHUCOIN(devWallet, deployer); // deployer receives farm allocation temporarily
        console.log("CTHUCOIN deployed at:", address(cthu));

        // 4. Deploy CthuFarm
        farm = new CthuFarm(address(cthu), farmStartTime);
        console.log("CthuFarm deployed at:", address(farm));

        // Transfer farm allocation to farm contract
        uint256 farmAllocation = cthu.FARM_ALLOCATION();
        cthu.transfer(address(farm), farmAllocation);
        console.log("Transferred farm allocation:", farmAllocation / 1e18, "CTHU");

        // 5. Deploy CthuFactory
        factory = new CthuFactory(
            treasury,        // feeTo
            address(cthu),   // cthu token
            BURN_ADDRESS,    // burn address
            treasury         // staking rewards (using treasury for now)
        );
        console.log("CthuFactory deployed at:", address(factory));

        // 6. Deploy CthuRouter
        router = new CthuRouter(address(factory), address(wmonad));
        console.log("CthuRouter deployed at:", address(router));

        // 7. Deploy Leaderboard
        leaderboard = new Leaderboard(address(cthu));
        console.log("Leaderboard deployed at:", address(leaderboard));

        // 8. Deploy CultistLaunchpad
        launchpad = new CultistLaunchpad(
            address(cthu),
            address(factory),
            address(router),
            treasury,
            address(wmonad)
        );
        console.log("CultistLaunchpad deployed at:", address(launchpad));

        vm.stopBroadcast();

        // Log all addresses
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("WMONAD:", address(wmonad));
        console.log("CTHUCOIN:", address(cthu));
        console.log("CthuFactory:", address(factory));
        console.log("CthuRouter:", address(router));
        console.log("CthuFarm:", address(farm));
        console.log("Leaderboard:", address(leaderboard));
        console.log("CultistLaunchpad:", address(launchpad));
        console.log("\nNext steps:");
        console.log("1. Add farm pools using AddPools.s.sol");
        console.log("2. Add initial liquidity using AddLiquidity.s.sol");
        console.log("3. Verify contracts on explorer");
    }

    function computeCreateAddress(address deployer, uint256 nonce) internal pure returns (address) {
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
