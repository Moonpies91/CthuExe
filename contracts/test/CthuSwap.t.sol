// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CTHUCOIN.sol";
import "../src/dex/CthuFactory.sol";
import "../src/dex/CthuRouter.sol";
import "../src/dex/CthuPair.sol";
import "../src/dex/WMONAD.sol";

contract CthuSwapTest is Test {
    CTHUCOIN public cthu;
    WMONAD public wmonad;
    CthuFactory public factory;
    CthuRouter public router;

    address public treasury = address(0x100);
    address public stakingRewards = address(0x101);
    address public devWallet = address(0x1);
    address public farmContract = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);

    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    function setUp() public {
        // Deploy tokens
        cthu = new CTHUCOIN(devWallet, farmContract);
        wmonad = new WMONAD();

        // Deploy DEX
        factory = new CthuFactory(treasury, address(cthu), BURN_ADDRESS, stakingRewards);
        router = new CthuRouter(address(factory), address(wmonad));

        // Fund test accounts
        vm.deal(user1, 1000 ether);
        vm.deal(user2, 1000 ether);
        cthu.transfer(user1, 1_000_000 * 10**18);
        cthu.transfer(user2, 1_000_000 * 10**18);
    }

    // ============ Factory Tests ============

    function test_CreatePair() public {
        address pair = factory.createPair(address(cthu), address(wmonad));

        assertTrue(pair != address(0));
        assertEq(factory.getPair(address(cthu), address(wmonad)), pair);
        assertEq(factory.allPairsLength(), 1);
    }

    function test_CannotCreateDuplicatePair() public {
        factory.createPair(address(cthu), address(wmonad));

        vm.expectRevert("CthuFactory: PAIR_EXISTS");
        factory.createPair(address(cthu), address(wmonad));
    }

    function test_CannotCreatePairWithSameTokens() public {
        vm.expectRevert("CthuFactory: IDENTICAL_ADDRESSES");
        factory.createPair(address(cthu), address(cthu));
    }

    // ============ Router Tests - Add Liquidity ============

    function test_AddLiquidityMONAD() public {
        uint256 cthuAmount = 100_000 * 10**18;
        uint256 monadAmount = 10 ether;

        vm.startPrank(user1);
        cthu.approve(address(router), cthuAmount);

        (uint256 amountToken, uint256 amountMONAD, uint256 liquidity) = router.addLiquidityMONAD{value: monadAmount}(
            address(cthu),
            cthuAmount,
            0,
            0,
            user1,
            block.timestamp + 300
        );
        vm.stopPrank();

        assertEq(amountToken, cthuAmount);
        assertEq(amountMONAD, monadAmount);
        assertTrue(liquidity > 0);

        // Check pair was created
        address pair = factory.getPair(address(cthu), address(wmonad));
        assertTrue(pair != address(0));

        // Check LP tokens received
        assertEq(CthuPair(pair).balanceOf(user1), liquidity);
    }

    function test_AddLiquidityToExistingPair() public {
        uint256 cthuAmount = 100_000 * 10**18;
        uint256 monadAmount = 10 ether;

        // First liquidity add
        vm.startPrank(user1);
        cthu.approve(address(router), cthuAmount * 2);
        router.addLiquidityMONAD{value: monadAmount}(
            address(cthu),
            cthuAmount,
            0,
            0,
            user1,
            block.timestamp + 300
        );
        vm.stopPrank();

        // Second liquidity add
        vm.startPrank(user2);
        cthu.approve(address(router), cthuAmount);
        (,, uint256 liquidity2) = router.addLiquidityMONAD{value: monadAmount}(
            address(cthu),
            cthuAmount,
            0,
            0,
            user2,
            block.timestamp + 300
        );
        vm.stopPrank();

        assertTrue(liquidity2 > 0);
    }

    // ============ Router Tests - Swap ============

    function test_SwapExactMONADForTokens() public {
        // Setup liquidity
        _addLiquidity(100_000 * 10**18, 10 ether);

        uint256 swapAmount = 1 ether;
        uint256 cthuBefore = cthu.balanceOf(user2);

        address[] memory path = new address[](2);
        path[0] = address(wmonad);
        path[1] = address(cthu);

        vm.prank(user2);
        uint256[] memory amounts = router.swapExactMONADForTokens{value: swapAmount}(
            0,
            path,
            user2,
            block.timestamp + 300
        );

        assertTrue(amounts[1] > 0);
        assertEq(cthu.balanceOf(user2), cthuBefore + amounts[1]);
    }

    function test_SwapExactTokensForMONAD() public {
        // Setup liquidity
        _addLiquidity(100_000 * 10**18, 10 ether);

        uint256 swapAmount = 1000 * 10**18;
        uint256 monadBefore = user2.balance;

        address[] memory path = new address[](2);
        path[0] = address(cthu);
        path[1] = address(wmonad);

        vm.startPrank(user2);
        cthu.approve(address(router), swapAmount);
        uint256[] memory amounts = router.swapExactTokensForMONAD(
            swapAmount,
            0,
            path,
            user2,
            block.timestamp + 300
        );
        vm.stopPrank();

        assertTrue(amounts[1] > 0);
        assertEq(user2.balance, monadBefore + amounts[1]);
    }

    // ============ Router Tests - Remove Liquidity ============

    function test_RemoveLiquidityMONAD() public {
        // Add liquidity first
        uint256 cthuAmount = 100_000 * 10**18;
        uint256 monadAmount = 10 ether;

        vm.startPrank(user1);
        cthu.approve(address(router), cthuAmount);
        (,, uint256 liquidity) = router.addLiquidityMONAD{value: monadAmount}(
            address(cthu),
            cthuAmount,
            0,
            0,
            user1,
            block.timestamp + 300
        );

        // Remove liquidity
        address pair = factory.getPair(address(cthu), address(wmonad));
        CthuPair(pair).approve(address(router), liquidity);

        uint256 cthuBefore = cthu.balanceOf(user1);
        uint256 monadBefore = user1.balance;

        (uint256 amountToken, uint256 amountMONAD) = router.removeLiquidityMONAD(
            address(cthu),
            liquidity,
            0,
            0,
            user1,
            block.timestamp + 300
        );
        vm.stopPrank();

        assertTrue(amountToken > 0);
        assertTrue(amountMONAD > 0);
        assertTrue(cthu.balanceOf(user1) > cthuBefore);
        assertTrue(user1.balance > monadBefore);
    }

    // ============ Price Calculation Tests ============

    function test_GetAmountsOut() public {
        _addLiquidity(100_000 * 10**18, 10 ether);

        address[] memory path = new address[](2);
        path[0] = address(wmonad);
        path[1] = address(cthu);

        uint256[] memory amounts = router.getAmountsOut(1 ether, path);

        assertTrue(amounts[1] > 0);
        // With 100k CTHU : 10 MONAD, 1 MONAD should get ~9970 CTHU (after 0.3% fee)
        assertApproxEqRel(amounts[1], 9970 * 10**18, 0.01e18);
    }

    // ============ Helper Functions ============

    function _addLiquidity(uint256 cthuAmount, uint256 monadAmount) internal {
        vm.startPrank(user1);
        cthu.approve(address(router), cthuAmount);
        router.addLiquidityMONAD{value: monadAmount}(
            address(cthu),
            cthuAmount,
            0,
            0,
            user1,
            block.timestamp + 300
        );
        vm.stopPrank();
    }

    // ============ Fuzz Tests ============

    function testFuzz_SwapDoesNotExceedReserves(uint256 swapAmount) public {
        _addLiquidity(100_000 * 10**18, 10 ether);

        swapAmount = bound(swapAmount, 0.001 ether, 5 ether);

        address[] memory path = new address[](2);
        path[0] = address(wmonad);
        path[1] = address(cthu);

        vm.prank(user2);
        uint256[] memory amounts = router.swapExactMONADForTokens{value: swapAmount}(
            0,
            path,
            user2,
            block.timestamp + 300
        );

        assertTrue(amounts[1] < 100_000 * 10**18);
    }
}
