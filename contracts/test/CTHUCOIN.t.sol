// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CTHUCOIN.sol";

contract CTHUCOINTest is Test {
    CTHUCOIN public cthu;

    address public devWallet = address(0x1);
    address public farmContract = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);

    function setUp() public {
        cthu = new CTHUCOIN(devWallet, farmContract);
    }

    // ============ Deployment Tests ============

    function test_Deployment() public view {
        assertEq(cthu.name(), "cthu.nad");
        assertEq(cthu.symbol(), "CTHU");
        assertEq(cthu.decimals(), 18);
        assertEq(cthu.totalSupply(), cthu.TOTAL_SUPPLY());
    }

    function test_InitialDistribution() public view {
        // Deployer gets initial liquidity
        assertEq(cthu.balanceOf(address(this)), cthu.INITIAL_LIQUIDITY());

        // Farm contract gets farm allocation
        assertEq(cthu.balanceOf(farmContract), cthu.FARM_ALLOCATION());

        // Dev allocation held in contract for vesting
        assertEq(cthu.balanceOf(address(cthu)), cthu.DEV_ALLOCATION());
    }

    function test_ImmutableAddresses() public view {
        assertEq(cthu.devWallet(), devWallet);
        assertEq(cthu.farmContract(), farmContract);
    }

    // ============ Vesting Tests ============

    function test_VestingStartsAtZero() public view {
        assertEq(cthu.claimableDevTokens(), 0);
    }

    function test_VestingAfterHalfYear() public {
        // Warp to 6 months
        vm.warp(block.timestamp + 182.5 days);

        uint256 claimable = cthu.claimableDevTokens();
        uint256 expected = cthu.DEV_ALLOCATION() / 2;

        // Allow 1% margin for rounding
        assertApproxEqRel(claimable, expected, 0.01e18);
    }

    function test_VestingAfterFullYear() public {
        // Warp to 1 year
        vm.warp(block.timestamp + 365 days);

        uint256 claimable = cthu.claimableDevTokens();
        assertEq(claimable, cthu.DEV_ALLOCATION());
    }

    function test_ClaimDevTokens() public {
        // Warp to 6 months
        vm.warp(block.timestamp + 182.5 days);

        uint256 claimableBefore = cthu.claimableDevTokens();

        vm.prank(devWallet);
        cthu.claimDevTokens();

        assertEq(cthu.balanceOf(devWallet), claimableBefore);
        assertEq(cthu.claimableDevTokens(), 0);
    }

    function test_OnlyDevCanClaim() public {
        vm.warp(block.timestamp + 182.5 days);

        vm.prank(user1);
        vm.expectRevert("CTHU: Not dev wallet");
        cthu.claimDevTokens();
    }

    function test_CannotClaimZero() public {
        vm.prank(devWallet);
        vm.expectRevert("CTHU: Nothing to claim");
        cthu.claimDevTokens();
    }

    function test_MultipleClaims() public {
        // First claim at 3 months
        vm.warp(block.timestamp + 91.25 days);
        vm.prank(devWallet);
        cthu.claimDevTokens();

        uint256 firstClaim = cthu.balanceOf(devWallet);

        // Second claim at 6 months
        vm.warp(block.timestamp + 91.25 days);
        vm.prank(devWallet);
        cthu.claimDevTokens();

        uint256 secondClaim = cthu.balanceOf(devWallet) - firstClaim;

        // Both claims should be approximately equal
        assertApproxEqRel(firstClaim, secondClaim, 0.01e18);
    }

    // ============ Burn Tests ============

    function test_BurnToDead() public {
        uint256 burnAmount = 1000 * 10**18;

        cthu.burnToDead(burnAmount);

        assertEq(cthu.balanceOf(cthu.BURN_ADDRESS()), burnAmount);
        assertEq(cthu.totalBurned(), burnAmount);
    }

    function test_StandardBurn() public {
        uint256 burnAmount = 1000 * 10**18;
        uint256 balanceBefore = cthu.balanceOf(address(this));

        cthu.burn(burnAmount);

        assertEq(cthu.balanceOf(address(this)), balanceBefore - burnAmount);
        assertEq(cthu.totalSupply(), cthu.TOTAL_SUPPLY() - burnAmount);
    }

    // ============ Transfer Tests ============

    function test_Transfer() public {
        uint256 amount = 1000 * 10**18;

        cthu.transfer(user1, amount);

        assertEq(cthu.balanceOf(user1), amount);
    }

    function test_TransferFrom() public {
        uint256 amount = 1000 * 10**18;

        cthu.approve(user1, amount);

        vm.prank(user1);
        cthu.transferFrom(address(this), user2, amount);

        assertEq(cthu.balanceOf(user2), amount);
    }

    // ============ Vesting Info Tests ============

    function test_VestingInfo() public view {
        (uint256 start, uint256 duration, uint256 claimed, uint256 remaining) = cthu.vestingInfo();

        assertEq(start, cthu.vestingStart());
        assertEq(duration, cthu.VESTING_DURATION());
        assertEq(claimed, 0);
        assertEq(remaining, cthu.DEV_ALLOCATION());
    }

    // ============ Fuzz Tests ============

    function testFuzz_VestingLinear(uint256 timeElapsed) public {
        // Bound time to vesting period
        timeElapsed = bound(timeElapsed, 0, cthu.VESTING_DURATION());

        vm.warp(block.timestamp + timeElapsed);

        uint256 claimable = cthu.claimableDevTokens();
        uint256 expected = (cthu.DEV_ALLOCATION() * timeElapsed) / cthu.VESTING_DURATION();

        assertEq(claimable, expected);
    }

    function testFuzz_BurnAmount(uint256 amount) public {
        uint256 balance = cthu.balanceOf(address(this));
        amount = bound(amount, 0, balance);

        if (amount > 0) {
            cthu.burnToDead(amount);
            assertEq(cthu.totalBurned(), amount);
        }
    }
}
