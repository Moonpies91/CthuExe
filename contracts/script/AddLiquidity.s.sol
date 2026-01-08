// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTHUCOIN.sol";
import "../src/dex/CthuFactory.sol";
import "../src/dex/CthuRouter.sol";
import "../src/dex/WMONAD.sol";
import "../src/interfaces/ICthuPair.sol";

/**
 * @title AddLiquidity
 * @notice Script to add initial liquidity to CTHU/MONAD pair
 * @dev Run with: forge script script/AddLiquidity.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Initial Liquidity Configuration:
 * - 15,000,000 CTHU
 * - 11,000 MONAD
 * - LP tokens burned to 0xdead
 */
contract AddLiquidityScript is Script {
    // Contract addresses (set from environment)
    address public cthuAddress;
    address public factoryAddress;
    address public routerAddress;
    address public wmonadAddress;

    // Constants
    uint256 constant CTHU_AMOUNT = 15_000_000 * 10**18;  // 15M CTHU
    uint256 constant MONAD_AMOUNT = 11_000 * 10**18;     // 11K MONAD
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    function setUp() public {
        cthuAddress = vm.envAddress("CTHUCOIN_ADDRESS");
        factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        routerAddress = vm.envAddress("ROUTER_ADDRESS");
        wmonadAddress = vm.envAddress("WMONAD_ADDRESS");
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        CTHUCOIN cthu = CTHUCOIN(cthuAddress);
        CthuFactory factory = CthuFactory(factoryAddress);
        CthuRouter router = CthuRouter(payable(routerAddress));

        console.log("Adding initial liquidity...");
        console.log("Deployer:", deployer);
        console.log("CTHU Balance:", cthu.balanceOf(deployer) / 1e18);
        console.log("MONAD Balance:", deployer.balance / 1e18);

        require(cthu.balanceOf(deployer) >= CTHU_AMOUNT, "Insufficient CTHU");
        require(deployer.balance >= MONAD_AMOUNT, "Insufficient MONAD");

        vm.startBroadcast(deployerPrivateKey);

        // Approve router to spend CTHU
        cthu.approve(address(router), CTHU_AMOUNT);
        console.log("Approved router for CTHU");

        // Add liquidity
        (uint256 amountToken, uint256 amountMONAD, uint256 liquidity) = router.addLiquidityMONAD{value: MONAD_AMOUNT}(
            address(cthu),
            CTHU_AMOUNT,
            CTHU_AMOUNT * 95 / 100,  // 5% slippage
            MONAD_AMOUNT * 95 / 100, // 5% slippage
            deployer,
            block.timestamp + 300
        );

        console.log("Liquidity added:");
        console.log("  CTHU:", amountToken / 1e18);
        console.log("  MONAD:", amountMONAD / 1e18);
        console.log("  LP Tokens:", liquidity / 1e18);

        // Get pair address
        address pair = factory.getPair(address(cthu), wmonadAddress);
        console.log("Pair address:", pair);

        // Keep LP tokens in deployer wallet (not burning)
        ICthuPair lpToken = ICthuPair(pair);
        uint256 lpBalance = lpToken.balanceOf(deployer);
        console.log("LP tokens received:", lpBalance / 1e18);
        console.log("LP tokens kept in wallet:", deployer);

        vm.stopBroadcast();

        // Verify
        console.log("\n=== LIQUIDITY ADDED ===");
        console.log("Pair:", pair);
        console.log("LP tokens in your wallet:", lpBalance / 1e18);

        // Calculate initial price
        uint256 pricePerCthu = (amountMONAD * 1e18) / amountToken;
        console.log("Initial price:", pricePerCthu, "wei MONAD per CTHU");
    }
}
