// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/dex/CthuPair.sol";

contract InitCodeHashTest is Test {
    function test_GetInitCodeHash() public pure {
        bytes32 hash = keccak256(type(CthuPair).creationCode);
        console.log("CthuPair init code hash:");
        console.logBytes32(hash);
    }
}
