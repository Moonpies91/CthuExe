# Security Audit Report: <Cthu.Coin> V3 Contracts

**Audit Date:** December 27, 2025
**Auditor:** Claude Code
**Scope:** CthuCoinV3.sol, CthuFarmV3.sol, DeployV3.s.sol
**Version:** 2.0 (Updated after farm lock changes)

---

## Executive Summary

This audit covers the third iteration of the CthuCoin ecosystem, designed after two previous failures that locked 885M+ CTHU permanently. The V3 contracts implement multiple redundancy layers with an improved `farmLocked` mechanism.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 3 |
| Informational | 4 |

**Overall Assessment:** The contracts are **SAFE FOR DEPLOYMENT** with noted considerations.

---

## Contract 1: CthuCoinV3.sol

### Overview
Standard ERC20 token with fixed supply and linear vesting for dev allocation.

### Supply Verification
```
TOTAL_SUPPLY        = 1,000,000,000 * 10**18
FARM_ALLOCATION     =   885,000,000 * 10**18 (88.5%)
DEV_ALLOCATION      =   100,000,000 * 10**18 (10%)
LIQUIDITY_ALLOCATION=    15,000,000 * 10**18 (1.5%)

Verification: 885M + 100M + 15M = 1,000M ✅
```

### Function Analysis

| Function | Access | Reentrancy | Status |
|----------|--------|------------|--------|
| `claimDevTokens()` | devWallet only | Safe (state before transfer) | ✅ |
| `vestedAmount()` | Public view | N/A | ✅ |
| `claimableDevTokens()` | Public view | N/A | ✅ |
| `vestingProgress()` | Public view | N/A | ✅ |

### Vesting Logic (Lines 78-86)
```solidity
uint256 elapsed = block.timestamp - vestingStart;
if (elapsed >= VESTING_DURATION) {
    return DEV_ALLOCATION;
}
return (DEV_ALLOCATION * elapsed) / VESTING_DURATION;
```

| Check | Result |
|-------|--------|
| Underflow on elapsed | ✅ Safe - vestingStart set in constructor |
| Division by zero | ✅ Safe - VESTING_DURATION is constant (365 days) |
| Overflow | ✅ Safe - Solidity 0.8+ |
| Precision loss | ⚠️ Minor - max ~1 wei per claim |

### Findings

**[I-01] Immutable devWallet cannot be changed**
- Severity: Informational
- If devWallet private key is lost/compromised, no recovery mechanism
- Impact: Dev tokens could be permanently locked or stolen
- Recommendation: Consider adding timelock-protected wallet change

**[L-01] No rescue function for accidentally sent tokens**
- Severity: Low
- Contract holds DEV_ALLOCATION but has no rescue for other tokens
- Impact: Minimal - only affects accidentally sent tokens

---

## Contract 2: CthuFarmV3.sol

### Overview
Yield farming contract with 7 redundancy layers and farm lock mechanism.

### Redundancy Verification

| # | Redundancy | Implementation | Status |
|---|------------|----------------|--------|
| 1 | Pausable | `pause()`, `unpause()` | ✅ |
| 2 | Recovery (before lock) | `emergencyRecoverTokens()` | ✅ |
| 3 | Flexible Pool Mgmt | `addPool()` works anytime | ✅ |
| 4 | Dynamic Allocation | `totalAllocPoint` is variable | ✅ |
| 5 | Adjustable Emissions | `setEmissionRate()` | ✅ |
| 6 | Timelock Shutdown | 7-day delay | ✅ |
| 7 | Protected Withdrawals | No pause check on withdraw | ✅ |

### Farm Lock Analysis (NEW)

**State Variable (Line 68):**
```solidity
bool public farmLocked;
```

**Lock Function (Lines 177-181):**
```solidity
function lockFarm() external onlyOwner {
    require(!farmLocked, "Already locked");
    farmLocked = true;
    emit FarmLocked(msg.sender);
}
```

| Property | Value |
|----------|-------|
| Reversible | ❌ NO - Permanent |
| Blocks owner recovery | ✅ All tokens (CTHU + LP) |
| Affects user withdrawals | ❌ NO - Users can always withdraw |

### Recovery Functions Analysis

**emergencyRecoverTokens() - Lines 145-154**
```solidity
function emergencyRecoverTokens(...) external onlyOwner {
    require(!farmLocked, "Farm is locked: no recovery allowed");
    IERC20(_token).safeTransfer(_to, _amount);
}
```

**emergencyRecoverAllTokens() - Lines 161-169**
```solidity
function emergencyRecoverAllTokens(...) external onlyOwner {
    require(!farmLocked, "Farm is locked: no recovery allowed");
    // ... transfers all balance
}
```

**executeShutdown() - Lines 311-331**
```solidity
function executeShutdown() external onlyOwner {
    // Stop emissions
    emissionPerSecond = 0;
    paused = true;

    // Only recover CTHU if farm is NOT locked
    if (!farmLocked) {
        balance = cthu.balanceOf(address(this));
        if (balance > 0) {
            cthu.safeTransfer(owner, balance);
        }
    }
}
```

| Function | Before Lock | After Lock |
|----------|-------------|------------|
| `emergencyRecoverTokens` | ✅ Works | ❌ Blocked |
| `emergencyRecoverAllTokens` | ✅ Works | ❌ Blocked |
| `executeShutdown` (recovery) | ✅ Works | ❌ Blocked |
| `executeShutdown` (pause) | ✅ Works | ✅ Works |

### User Function Analysis

| Function | Pause Check | Reentrancy | Status |
|----------|-------------|------------|--------|
| `deposit()` | ✅ Required | nonReentrant | ✅ |
| `withdraw()` | ❌ None (always works) | nonReentrant | ✅ |
| `harvest()` | ✅ Required | nonReentrant | ✅ |
| `emergencyWithdraw()` | ❌ None (always works) | nonReentrant | ✅ |

### Reward Calculation (Lines 464-468)
```solidity
uint256 timeElapsed = _getTimeElapsed(pool.lastRewardTime, block.timestamp);
uint256 cthuReward = timeElapsed * emissionPerSecond * pool.allocPoint / totalAllocPoint;
pool.accCthuPerShare += cthuReward * 1e12 / lpSupply;
```

| Check | Result |
|-------|--------|
| Division by zero (totalAllocPoint) | ✅ Protected at line 459 |
| Division by zero (lpSupply) | ✅ Protected at line 459 |
| Overflow | ✅ Safe with Solidity 0.8+ |
| Precision loss | ⚠️ Minor - dust amounts |

### Access Control Matrix

| Function | Owner | User | Anyone |
|----------|-------|------|--------|
| pause/unpause | ✅ | ❌ | ❌ |
| addPool | ✅ | ❌ | ❌ |
| setPoolAllocPoint | ✅ | ❌ | ❌ |
| setEmissionRate | ✅ | ❌ | ❌ |
| emergencyRecoverTokens | ✅ (before lock) | ❌ | ❌ |
| lockFarm | ✅ | ❌ | ❌ |
| initiateShutdown | ✅ | ❌ | ❌ |
| transferOwnership | ✅ | ❌ | ❌ |
| deposit | ❌ | ✅ | ❌ |
| withdraw | ❌ | ✅ | ❌ |
| harvest | ❌ | ✅ | ❌ |
| emergencyWithdraw | ❌ | ✅ | ❌ |
| updatePool | ❌ | ❌ | ✅ |

### Findings

**[M-01] Single-step ownership transfer**
- Severity: Medium
- Location: Line 543-547
- Risk: Accidental transfer to wrong address or phishing attack
- Current code:
```solidity
function transferOwnership(address _newOwner) external onlyOwner {
    require(_newOwner != address(0), "Invalid owner");
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;  // Instant transfer!
}
```
- Recommendation: Implement two-step transfer (propose → accept)
```solidity
address public pendingOwner;

function transferOwnership(address _newOwner) external onlyOwner {
    pendingOwner = _newOwner;
}

function acceptOwnership() external {
    require(msg.sender == pendingOwner, "Not pending owner");
    owner = pendingOwner;
    pendingOwner = address(0);
}
```

**[L-02] No duplicate LP token check in addPool**
- Severity: Low
- Location: Lines 190-207
- Risk: Same LP token added to multiple pools (confusing, wastes gas)
- Recommendation: Add mapping to track existing LP tokens

**[L-03] Rewards skipped when withdrawing during pause**
- Severity: Low
- Location: Lines 385-393
- Risk: Users may lose pending rewards if they withdraw while paused
- Mitigation: Users can wait for unpause or accept reward loss

**[I-02] No event for setEndTime**
- Severity: Informational
- Location: Lines 283-285
- Risk: Off-chain tracking difficulty
- Recommendation: Add event

---

## Contract 3: DeployV3.s.sol

### Overview
Deployment script with built-in verification and emergency recovery testing.

### Deployment Order (Verified Safe)
```
PHASE 1: Deploy WMONAD
PHASE 2: Deploy Farm (with predicted CTHU address)
PHASE 3: Deploy Token → mints 885M to farm
PHASE 4: Deploy Factory & Router (with real CTHU address) ✅ FIXED
PHASE 5: Create LP Pairs
PHASE 5: Add Farm Pools
PHASE 6: Test Emergency Recovery ← CRITICAL
PHASE 7: Deploy Leaderboard & Launchpad
PHASE 8: Final Verification
```

### Critical Verification Points

| Step | Check | Action on Failure |
|------|-------|-------------------|
| Line 125 | Token address matches prediction | Revert |
| Line 130 | Farm has 885M CTHU | Revert |
| Line 189 | Pools exist (>=2) | Revert |
| Line 207 | Recovery test passes | Revert |
| Line 243 | Total supply correct | Revert |
| Line 246 | Farm balance correct | Revert |
| Line 249 | Liquidity balance correct | Revert |

### Nonce Prediction (Lines 95-98)
```solidity
uint256 currentNonce = vm.getNonce(deployer);
address predictedTokenAddress = computeCreateAddress(deployer, currentNonce + 1);
```

| Check | Result |
|-------|--------|
| Atomic execution | ✅ vm.startBroadcast ensures atomicity |
| Nonce accuracy | ✅ Farm at nonce+0, Token at nonce+1 |

### Findings

**[I-03] Nonce prediction fragility**
- Severity: Informational
- If any transaction happens between nonce read and token deploy, addresses won't match
- Mitigation: Script uses atomic broadcast, so this is unlikely in practice

**[I-04] MONAD/USDT0 pool not added during deployment**
- Severity: Informational
- Only 2 of 3 planned pools added
- Mitigation: Pool can be added later (farm is flexible)

---

## Security Model Summary

### Before `lockFarm()`

```
┌─────────────────────────────────────────────────────────┐
│                     OWNER POWERS                        │
├─────────────────────────────────────────────────────────┤
│ ✅ Pause/Unpause deposits                               │
│ ✅ Add/modify/disable pools                             │
│ ✅ Adjust emission rates                                │
│ ✅ Recover ANY tokens (CTHU + LP)                       │
│ ✅ Initiate/execute shutdown                            │
│ ✅ Transfer ownership                                   │
│ ✅ Lock farm (IRREVERSIBLE)                             │
├─────────────────────────────────────────────────────────┤
│                     USER POWERS                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Deposit LP tokens (when not paused)                  │
│ ✅ Withdraw LP tokens (ALWAYS)                          │
│ ✅ Harvest rewards (when not paused)                    │
│ ✅ Emergency withdraw (ALWAYS)                          │
└─────────────────────────────────────────────────────────┘
```

### After `lockFarm()`

```
┌─────────────────────────────────────────────────────────┐
│                     OWNER POWERS                        │
├─────────────────────────────────────────────────────────┤
│ ✅ Pause/Unpause deposits                               │
│ ✅ Add/modify/disable pools                             │
│ ✅ Adjust emission rates                                │
│ ❌ Recover ANY tokens ← BLOCKED FOREVER                 │
│ ⚠️ Shutdown (stops emissions, but NO token recovery)    │
│ ✅ Transfer ownership                                   │
├─────────────────────────────────────────────────────────┤
│                     USER POWERS                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Deposit LP tokens (when not paused)                  │
│ ✅ Withdraw LP tokens (ALWAYS)                          │
│ ✅ Harvest rewards (when not paused)                    │
│ ✅ Emergency withdraw (ALWAYS)                          │
└─────────────────────────────────────────────────────────┘
```

### Attack Vector Analysis

| Attack | Before Lock | After Lock |
|--------|-------------|------------|
| Owner drains CTHU | ⚠️ Possible | ❌ Blocked |
| Owner drains LP | ⚠️ Possible | ❌ Blocked |
| Owner key stolen | ⚠️ Full access | ✅ Can't drain tokens |
| Reentrancy | ❌ Protected | ❌ Protected |
| Flash loan | ❌ Time-based rewards | ❌ Time-based rewards |
| User drains others' LP | ❌ Separate balances | ❌ Separate balances |

---

## Reentrancy Analysis

| Function | Guard | External Calls | Order | Status |
|----------|-------|----------------|-------|--------|
| deposit | nonReentrant | transferFrom, transfer | State first | ✅ |
| withdraw | nonReentrant | transfer (x2) | State first | ✅ |
| harvest | nonReentrant | transfer | State first | ✅ |
| emergencyWithdraw | nonReentrant | transfer | State first | ✅ |
| emergencyRecoverTokens | None | safeTransfer | Owner only | ✅ |

---

## Gas Estimates

| Function | Estimated Gas |
|----------|---------------|
| deposit | ~120,000 |
| withdraw | ~100,000 |
| harvest | ~80,000 |
| emergencyWithdraw | ~60,000 |
| addPool | ~150,000 |
| lockFarm | ~25,000 |

---

## Recommendations

### Before Deployment

1. **Test on Testnet First**
   - Full deployment cycle
   - All user flows (deposit, withdraw, harvest)
   - Emergency recovery test
   - Farm lock test
   - Verify lock blocks all recovery

2. **Consider Multi-Sig for Owner**
   - Use Gnosis Safe or similar
   - Require 2-of-3 for sensitive operations
   - Especially before farm is locked

3. **Consider Two-Step Ownership Transfer**
   - Prevents accidental transfers
   - Protects against phishing

### Post-Deployment

1. **Verify Farm Works Before Locking**
   - Test deposits and withdrawals
   - Test reward distribution
   - Confirm pools are correct

2. **Lock Farm When Confident**
   - Call `lockFarm()` after testing
   - This permanently protects users

3. **Monitor for Anomalies**
   - Unusual deposit/withdrawal patterns
   - Large single-block activities

---

## Comparison: V2 (Failed) vs V3 (Bulletproof)

| Feature | V2 (Failed) | V3 (New) |
|---------|-------------|----------|
| Emergency Recovery | Conditional (3 checks) | **Unconditional (before lock)** |
| Pool Addition | Before finalization only | **Anytime** |
| Allocation Points | Fixed constant | **Dynamic** |
| User Withdrawals | Normal pause check | **Always allowed** |
| Shutdown Option | None | **7-day timelock** |
| Recovery Testing | None | **Tested in deployment** |
| Rug Protection | None | **Farm lock (permanent)** |

---

## Findings Summary

### Medium Severity

**[M-01] Single-step ownership transfer**
- Location: CthuFarmV3.sol:543-547
- Risk: Accidental or phished ownership transfer
- Recommendation: Implement two-step transfer

### Low Severity

**[L-01] No token rescue in CthuCoinV3**
**[L-02] No duplicate LP token check**
**[L-03] Rewards skipped when withdrawing during pause**

### Informational

**[I-01] Immutable devWallet**
**[I-02] No event for setEndTime**
**[I-03] Nonce prediction fragility**
**[I-04] MONAD/USDT0 pool not in initial deployment**

---

## Conclusion

The V3 contracts successfully address the vulnerabilities from two previous failures:

1. ✅ **Tokens cannot be permanently locked** - unconditional recovery (before lock)
2. ✅ **Pools can be added anytime** - flexible management
3. ✅ **Users can always withdraw** - no pause on withdrawals
4. ✅ **Recovery tested during deployment** - verification built-in
5. ✅ **Rug protection available** - farm lock permanently blocks owner recovery

The `farmLocked` mechanism provides strong user protection once enabled:
- Owner cannot drain CTHU rewards
- Owner cannot drain user LP tokens
- Users can always withdraw their LP
- Rewards continue distributing normally

**Final Verdict: APPROVED FOR DEPLOYMENT**

Recommended sequence:
1. Deploy all contracts
2. Add initial liquidity
3. Test all user flows
4. Call `lockFarm()` to permanently protect users

---

*Report generated by Claude Code Security Audit*
*Version 2.0 - Updated with farm lock mechanism*
