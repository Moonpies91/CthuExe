# Bulletproof Farm Contract Design

## Failure History

### Failure #1 (Original CthuCoin)
- **What happened:** Farm deployed with `startTime = block.timestamp + 1 hour` in constructor
- **Why it failed:** `addPool()` required `block.timestamp < startTime`, but pools weren't added in time
- **Result:** 885M CTHU locked forever

### Failure #2 (cthu.nad)
- **What happened:** Farm finalized with only 1 pool instead of 3
- **Why it failed:** Deploy script finalized immediately after adding Pool 0, skipping USDT pools
- **Recovery blocked:** `emergencyRecoverTokens` requires `!startTimeFinalized || block.timestamp < startTime || poolInfo.length == 0` - all false during active farming
- **Result:** ~398M CTHU will remain locked (45% of emissions with no destination)

---

## Root Cause Analysis

Both failures share common themes:
1. **Irreversible state transitions** - Once finalized/started, no going back
2. **No unconditional owner recovery** - Recovery functions have conditions that can all become false
3. **Time-based lockouts** - Conditions tied to timestamps that inevitably pass
4. **Single points of failure** - No redundant recovery mechanisms

---

## Bulletproof Design Principles

### Principle 1: ALWAYS Have an Escape Hatch
Owner must ALWAYS be able to recover tokens, regardless of contract state.

### Principle 2: Pausable Everything
Every critical function should be pausable as a circuit breaker.

### Principle 3: Timelocked Emergency Actions
Dangerous actions require timelock, but emergency recovery should be immediate for owner.

### Principle 4: Pool Management Flexibility
Pools should be addable/removable at any time (with safeguards for user funds).

### Principle 5: Multi-Sig for Irreversible Actions
Critical actions require multiple confirmations or timelock delays.

---

## New Farm Contract Architecture

### Recovery Hierarchy (Multiple Redundancies)

```
Level 1: Normal Operations
├── deposit(), withdraw(), harvest() - Always work for users
├── addPool(), updatePool() - Owner can manage pools anytime
└── setEmissionRate() - Owner can adjust emissions

Level 2: Pause Mode (Circuit Breaker)
├── pause() - Owner can pause all deposits/harvests
├── Users can ALWAYS withdraw (even when paused)
└── Owner can add/remove pools while paused

Level 3: Emergency Recovery (Owner)
├── emergencyRecoverTokens() - NO CONDITIONS, owner can always call
├── emergencyRecoverLP() - Return LP tokens to users if needed
└── emergencyShutdown() - Stop all emissions, enable full recovery

Level 4: Nuclear Option (Timelock)
├── selfDestruct() - 7-day timelock, returns all tokens to owner
└── Users have 7 days to withdraw before destruction
```

### Key Contract Features

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CthuFarmV3 {

    // ============ REDUNDANCY 1: Pausable ============
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    // Users can ALWAYS withdraw, even when paused
    modifier withdrawAlwaysAllowed() {
        _; // No pause check for withdrawals
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    // ============ REDUNDANCY 2: Unconditional Recovery ============

    /// @notice Owner can ALWAYS recover any tokens - NO CONDITIONS
    /// @dev This is the ultimate escape hatch. Use responsibly.
    function emergencyRecoverTokens(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        // NO REQUIRE STATEMENTS - Owner can always call this
        IERC20(_token).safeTransfer(_to, _amount);
        emit EmergencyRecovery(_token, _to, _amount);
    }

    // ============ REDUNDANCY 3: Flexible Pool Management ============

    /// @notice Add a pool at any time
    function addPool(address _lpToken, uint256 _allocPoint) external onlyOwner {
        // Can add pools anytime, even after farming starts
        _addPool(_lpToken, _allocPoint);
    }

    /// @notice Update pool allocation
    function setPoolAllocPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        // Can rebalance pools anytime
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /// @notice Disable a pool (set alloc to 0)
    function disablePool(uint256 _pid) external onlyOwner {
        totalAllocPoint -= poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = 0;
    }

    // ============ REDUNDANCY 4: Dynamic Allocation ============

    // Instead of fixed TOTAL_ALLOC_POINTS = 10000, use dynamic total
    uint256 public totalAllocPoint;

    // Rewards calculated as: emission * pool.allocPoint / totalAllocPoint
    // If only 1 pool exists, it gets 100% of emissions
    // If pools are added later, rewards rebalance automatically

    // ============ REDUNDANCY 5: Adjustable Emissions ============

    uint256 public emissionPerSecond;

    function setEmissionRate(uint256 _rate) external onlyOwner {
        massUpdatePools();
        emissionPerSecond = _rate;
    }

    function stopEmissions() external onlyOwner {
        massUpdatePools();
        emissionPerSecond = 0;
    }

    // ============ REDUNDANCY 6: Nuclear Option with Timelock ============

    uint256 public shutdownTimestamp;
    bool public shutdownInitiated;
    uint256 public constant SHUTDOWN_DELAY = 7 days;

    function initiateShutdown() external onlyOwner {
        shutdownTimestamp = block.timestamp + SHUTDOWN_DELAY;
        shutdownInitiated = true;
        emit ShutdownInitiated(shutdownTimestamp);
    }

    function cancelShutdown() external onlyOwner {
        shutdownInitiated = false;
        shutdownTimestamp = 0;
    }

    function executeShutdown() external onlyOwner {
        require(shutdownInitiated, "Not initiated");
        require(block.timestamp >= shutdownTimestamp, "Too early");

        // Return all remaining reward tokens to owner
        uint256 balance = cthu.balanceOf(address(this));
        cthu.safeTransfer(owner, balance);

        // Disable all future operations
        paused = true;
        emissionPerSecond = 0;
    }

    // ============ REDUNDANCY 7: User Protection ============

    /// @notice Users can ALWAYS withdraw their LP tokens
    /// @dev Works even when paused, even during shutdown
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        // NO pause check - users can always get their LP back
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "Insufficient");

        // Update and harvest if not paused
        if (!paused && emissionPerSecond > 0) {
            updatePool(_pid);
            uint256 pending = pendingReward(_pid, msg.sender);
            if (pending > 0) {
                _safeCthuTransfer(msg.sender, pending);
            }
        }

        user.amount -= _amount;
        pool.totalDeposited -= _amount;
        pool.lpToken.safeTransfer(msg.sender, _amount);

        user.rewardDebt = user.amount * pool.accCthuPerShare / 1e12;
    }

    /// @notice Emergency withdraw without rewards (always works)
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        // Absolute minimum - just return LP tokens
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalDeposited -= amount;

        pool.lpToken.safeTransfer(msg.sender, amount);
    }
}
```

---

## Deployment Checklist (Mandatory Steps)

### Pre-Deployment Verification

- [ ] **Test on testnet first** - Full cycle test with all scenarios
- [ ] **Verify emergencyRecoverTokens has NO conditions**
- [ ] **Verify withdraw() has NO pause check**
- [ ] **Verify totalAllocPoint is dynamic (not constant)**
- [ ] **Test: Can owner recover tokens after farming starts?**
- [ ] **Test: Can users withdraw when paused?**
- [ ] **Test: Can pools be added after farming starts?**

### Deployment Script Requirements

```solidity
// MANDATORY: Single atomic deployment
function deploy() {
    // 1. Deploy farm
    farm = new CthuFarmV3(cthuAddress);

    // 2. Transfer reward tokens
    cthu.transfer(address(farm), FARM_ALLOCATION);

    // 3. Add ALL pools BEFORE any other action
    farm.addPool(cthuMonadLP, 5500);
    farm.addPool(cthuUsdtLP, 2800);  // Use address(0) placeholder if LP doesn't exist
    farm.addPool(monadUsdtLP, 1700); // Use address(0) placeholder if LP doesn't exist

    // 4. Set emission rate
    farm.setEmissionRate(YEAR_1_EMISSION);

    // 5. VERIFY before continuing
    require(farm.poolLength() >= 1, "No pools!");
    require(cthu.balanceOf(address(farm)) == FARM_ALLOCATION, "Wrong balance!");

    // 6. Test recovery works (critical verification)
    farm.emergencyRecoverTokens(address(cthu), owner, 1); // Recover 1 wei
    require(cthu.balanceOf(owner) >= 1, "Recovery failed!");
    cthu.transfer(address(farm), 1); // Send it back

    console.log("VERIFIED: Emergency recovery works!");
}
```

### Post-Deployment Verification

```bash
# MUST pass all of these:

# 1. Verify pools exist
cast call $FARM "poolLength()" # Must be >= 1

# 2. Verify token balance
cast call $CTHU "balanceOf(address)" $FARM # Must be 885M

# 3. TEST emergency recovery (most important!)
cast send $FARM "emergencyRecoverTokens(address,address,uint256)" $CTHU $OWNER 1
# This MUST succeed! If it fails, DO NOT proceed.

# 4. Verify owner can pause
cast send $FARM "pause()"
cast call $FARM "paused()" # Must be true
cast send $FARM "unpause()"

# 5. Verify withdraw works when paused
cast send $FARM "pause()"
# Have test user try withdraw - MUST work
cast send $FARM "unpause()"
```

---

## Comparison: Old vs New

| Feature | Old Farm (Failed) | New Farm (Bulletproof) |
|---------|-------------------|------------------------|
| Emergency Recovery | Conditional (3 requirements) | **Unconditional** |
| Pool Addition | Only before finalization | **Anytime** |
| Total Alloc Points | Fixed constant (10000) | **Dynamic** |
| User Withdrawals | Normal function | **Always allowed, even paused** |
| Pause Mechanism | None | **Full pause with user protection** |
| Emission Control | Fixed schedule | **Adjustable by owner** |
| Shutdown Option | None | **7-day timelock nuclear option** |

---

## Summary: The 7 Redundancies

1. **Pausable** - Circuit breaker for emergencies
2. **Unconditional Recovery** - Owner can ALWAYS get tokens back
3. **Flexible Pool Management** - Add/modify pools anytime
4. **Dynamic Allocation** - No wasted emissions to non-existent pools
5. **Adjustable Emissions** - Can stop or modify emission rate
6. **Timelock Shutdown** - Nuclear option with user protection
7. **Protected Withdrawals** - Users can ALWAYS get LP tokens back

---

## Final Notes

**The #1 rule: NEVER deploy a contract where tokens can be permanently locked.**

Every single function that handles tokens must have an escape path. The owner must be able to recover tokens under ANY circumstance. Users must be able to withdraw their LP tokens under ANY circumstance.

If you're ever unsure, ask: "What if everything goes wrong? Can we still get the tokens back?"

If the answer is "no" or "maybe not", the contract is not ready for deployment.
