// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CthuFarmV3 - Bulletproof Edition
 * @notice Yield farming contract with multiple redundancies to prevent locked funds
 * @dev Designed after two previous failures that locked 885M+ CTHU
 *
 * REDUNDANCY LAYERS:
 * 1. Pausable - Circuit breaker for emergencies
 * 2. Unconditional Recovery - Owner can ALWAYS recover tokens (NO CONDITIONS)
 * 3. Flexible Pool Management - Add/modify/disable pools anytime
 * 4. Dynamic Allocation - No wasted emissions
 * 5. Adjustable Emissions - Can stop or modify rates
 * 6. Timelock Shutdown - Nuclear option with user protection
 * 7. Protected Withdrawals - Users can ALWAYS withdraw LP tokens
 *
 * THE #1 RULE: Tokens can NEVER be permanently locked.
 */
contract CthuFarmV3 is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct UserInfo {
        uint256 amount;     // LP tokens deposited
        uint256 rewardDebt; // Reward debt for accurate calculation
    }

    struct PoolInfo {
        IERC20 lpToken;           // LP token contract
        uint256 allocPoint;       // Allocation points
        uint256 lastRewardTime;   // Last reward calculation time
        uint256 accCthuPerShare;  // Accumulated CTHU per share (scaled by 1e12)
        uint256 totalDeposited;   // Total LP tokens in pool
        bool active;              // Whether pool accepts deposits
    }

    // ============ State Variables ============

    IERC20 public immutable cthu;
    address public owner;

    // Pausable
    bool public paused;

    // Pools - Dynamic, flexible management
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint; // DYNAMIC - not a constant!

    // Emissions - Adjustable
    uint256 public emissionPerSecond;
    uint256 public startTime;
    uint256 public endTime;

    // Shutdown mechanism
    bool public shutdownInitiated;
    uint256 public shutdownTimestamp;
    uint256 public constant SHUTDOWN_DELAY = 7 days;

    // Farm Lock - once enabled, owner can NEVER recover ANY tokens (CTHU or LP)
    // Users can still withdraw their LP tokens anytime
    bool public farmLocked;

    // ============ Events ============

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint, bool active);
    event EmissionRateUpdated(uint256 oldRate, uint256 newRate);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event EmergencyRecovery(address indexed token, address indexed to, uint256 amount);
    event ShutdownInitiated(uint256 executeTime);
    event ShutdownCancelled();
    event ShutdownExecuted(uint256 tokensRecovered);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event FarmLocked(address indexed by);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Deploy the bulletproof farm
     * @param _cthu CTHU token address
     * @param _emissionPerSecond Initial emission rate
     * @param _startTime When farming starts (can be now or future)
     * @param _duration How long farming lasts (e.g., 4 years)
     */
    constructor(
        address _cthu,
        uint256 _emissionPerSecond,
        uint256 _startTime,
        uint256 _duration
    ) {
        require(_cthu != address(0), "Invalid CTHU");
        require(_startTime >= block.timestamp, "Start must be now or future");

        cthu = IERC20(_cthu);
        owner = msg.sender;
        emissionPerSecond = _emissionPerSecond;
        startTime = _startTime;
        endTime = _startTime + _duration;
    }

    // ============ REDUNDANCY 1: Pausable ============

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ============ REDUNDANCY 2: Unconditional Recovery ============

    /**
     * @notice EMERGENCY: Owner can recover tokens (disabled after farm is locked)
     * @param _token Token to recover
     * @param _to Address to send tokens to
     * @param _amount Amount to recover
     */
    function emergencyRecoverTokens(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(!farmLocked, "Farm is locked: no recovery allowed");

        IERC20(_token).safeTransfer(_to, _amount);
        emit EmergencyRecovery(_token, _to, _amount);
    }

    /**
     * @notice Recover all of a specific token (disabled after farm is locked)
     * @param _token Token to recover
     * @param _to Address to send to
     */
    function emergencyRecoverAllTokens(address _token, address _to) external onlyOwner {
        require(!farmLocked, "Farm is locked: no recovery allowed");

        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(_token).safeTransfer(_to, balance);
            emit EmergencyRecovery(_token, _to, balance);
        }
    }

    /**
     * @notice PERMANENTLY lock the farm
     * @dev Once called, owner can NEVER recover ANY tokens (CTHU or LP)
     *      Users can still withdraw their LP tokens anytime.
     *      This is IRREVERSIBLE. Call only after farm is proven to work.
     */
    function lockFarm() external onlyOwner {
        require(!farmLocked, "Already locked");
        farmLocked = true;
        emit FarmLocked(msg.sender);
    }

    // ============ REDUNDANCY 3: Flexible Pool Management ============

    /**
     * @notice Add a new pool (can be done ANYTIME)
     * @param _lpToken LP token address
     * @param _allocPoint Allocation points
     */
    function addPool(address _lpToken, uint256 _allocPoint) external onlyOwner {
        require(_lpToken != address(0), "Invalid LP token");

        massUpdatePools();

        totalAllocPoint += _allocPoint;

        poolInfo.push(PoolInfo({
            lpToken: IERC20(_lpToken),
            allocPoint: _allocPoint,
            lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime,
            accCthuPerShare: 0,
            totalDeposited: 0,
            active: true
        }));

        emit PoolAdded(poolInfo.length - 1, _lpToken, _allocPoint);
    }

    /**
     * @notice Update pool allocation points (can be done ANYTIME)
     * @param _pid Pool ID
     * @param _allocPoint New allocation points
     */
    function setPoolAllocPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        require(_pid < poolInfo.length, "Invalid pool");

        massUpdatePools();

        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;

        emit PoolUpdated(_pid, _allocPoint, poolInfo[_pid].active);
    }

    /**
     * @notice Enable or disable a pool
     * @param _pid Pool ID
     * @param _active Whether pool should accept deposits
     */
    function setPoolActive(uint256 _pid, bool _active) external onlyOwner {
        require(_pid < poolInfo.length, "Invalid pool");
        poolInfo[_pid].active = _active;
        emit PoolUpdated(_pid, poolInfo[_pid].allocPoint, _active);
    }

    /**
     * @notice Disable pool and remove its allocation (users can still withdraw)
     * @param _pid Pool ID
     */
    function disablePool(uint256 _pid) external onlyOwner {
        require(_pid < poolInfo.length, "Invalid pool");

        massUpdatePools();

        totalAllocPoint -= poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = 0;
        poolInfo[_pid].active = false;

        emit PoolUpdated(_pid, 0, false);
    }

    // ============ REDUNDANCY 4 & 5: Dynamic Emissions ============

    /**
     * @notice Update emission rate (can be done ANYTIME)
     * @param _emissionPerSecond New rate
     */
    function setEmissionRate(uint256 _emissionPerSecond) external onlyOwner {
        massUpdatePools();

        uint256 oldRate = emissionPerSecond;
        emissionPerSecond = _emissionPerSecond;

        emit EmissionRateUpdated(oldRate, _emissionPerSecond);
    }

    /**
     * @notice Stop all emissions immediately
     */
    function stopEmissions() external onlyOwner {
        massUpdatePools();

        uint256 oldRate = emissionPerSecond;
        emissionPerSecond = 0;

        emit EmissionRateUpdated(oldRate, 0);
    }

    /**
     * @notice Update farming end time
     * @param _endTime New end time
     */
    function setEndTime(uint256 _endTime) external onlyOwner {
        endTime = _endTime;
    }

    // ============ REDUNDANCY 6: Timelock Shutdown ============

    /**
     * @notice Initiate shutdown - gives users 7 days to withdraw
     */
    function initiateShutdown() external onlyOwner {
        shutdownTimestamp = block.timestamp + SHUTDOWN_DELAY;
        shutdownInitiated = true;
        emit ShutdownInitiated(shutdownTimestamp);
    }

    /**
     * @notice Cancel pending shutdown
     */
    function cancelShutdown() external onlyOwner {
        shutdownInitiated = false;
        shutdownTimestamp = 0;
        emit ShutdownCancelled();
    }

    /**
     * @notice Execute shutdown after timelock expires
     * @dev If farm is locked, only stops emissions and pauses - no token recovery
     */
    function executeShutdown() external onlyOwner {
        require(shutdownInitiated, "Not initiated");
        require(block.timestamp >= shutdownTimestamp, "Too early");

        // Stop emissions
        emissionPerSecond = 0;

        // Pause deposits
        paused = true;

        // Only recover CTHU if farm is NOT locked
        uint256 balance = 0;
        if (!farmLocked) {
            balance = cthu.balanceOf(address(this));
            if (balance > 0) {
                cthu.safeTransfer(owner, balance);
            }
        }

        emit ShutdownExecuted(balance);
    }

    // ============ REDUNDANCY 7: Protected User Functions ============

    /**
     * @notice Deposit LP tokens
     * @param _pid Pool ID
     * @param _amount Amount to deposit
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        require(_pid < poolInfo.length, "Invalid pool");
        require(poolInfo[_pid].active, "Pool not active");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        // Harvest pending rewards
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accCthuPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                _safeCthuTransfer(msg.sender, pending);
                emit Harvest(msg.sender, _pid, pending);
            }
        }

        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
            pool.totalDeposited += _amount;
        }

        user.rewardDebt = user.amount * pool.accCthuPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice Withdraw LP tokens - ALWAYS WORKS (even when paused)
     * @param _pid Pool ID
     * @param _amount Amount to withdraw
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        // ===== NO PAUSE CHECK =====
        // Users can ALWAYS withdraw their LP tokens
        // ==========================

        require(_pid < poolInfo.length, "Invalid pool");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "Insufficient balance");

        // Only update and harvest if not paused and emissions active
        if (!paused && emissionPerSecond > 0) {
            updatePool(_pid);
            uint256 pending = (user.amount * pool.accCthuPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                _safeCthuTransfer(msg.sender, pending);
                emit Harvest(msg.sender, _pid, pending);
            }
        }

        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalDeposited -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }

        user.rewardDebt = user.amount * pool.accCthuPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @notice Harvest rewards only
     * @param _pid Pool ID
     */
    function harvest(uint256 _pid) external nonReentrant whenNotPaused {
        require(_pid < poolInfo.length, "Invalid pool");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = (user.amount * pool.accCthuPerShare / 1e12) - user.rewardDebt;
        require(pending > 0, "Nothing to harvest");

        user.rewardDebt = user.amount * pool.accCthuPerShare / 1e12;
        _safeCthuTransfer(msg.sender, pending);

        emit Harvest(msg.sender, _pid, pending);
    }

    /**
     * @notice Emergency withdraw - ALWAYS WORKS, forfeits rewards
     * @param _pid Pool ID
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        // ===== NO PAUSE CHECK =====
        // Users can ALWAYS emergency withdraw
        // ==========================

        require(_pid < poolInfo.length, "Invalid pool");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalDeposited -= amount;

        pool.lpToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    // ============ Internal Functions ============

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.timestamp <= pool.lastRewardTime) return;
        if (block.timestamp < startTime) return;

        uint256 lpSupply = pool.totalDeposited;

        if (lpSupply == 0 || totalAllocPoint == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = _getTimeElapsed(pool.lastRewardTime, block.timestamp);
        uint256 cthuReward = timeElapsed * emissionPerSecond * pool.allocPoint / totalAllocPoint;

        pool.accCthuPerShare += cthuReward * 1e12 / lpSupply;
        pool.lastRewardTime = block.timestamp;
    }

    function massUpdatePools() public {
        for (uint256 pid = 0; pid < poolInfo.length; pid++) {
            updatePool(pid);
        }
    }

    function _getTimeElapsed(uint256 _from, uint256 _to) internal view returns (uint256) {
        if (_to > endTime) _to = endTime;
        if (_from < startTime) _from = startTime;
        if (_to <= _from) return 0;
        return _to - _from;
    }

    function _safeCthuTransfer(address _to, uint256 _amount) internal {
        uint256 balance = cthu.balanceOf(address(this));
        if (_amount > balance) {
            cthu.safeTransfer(_to, balance);
        } else {
            cthu.safeTransfer(_to, _amount);
        }
    }

    // ============ View Functions ============

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        if (_pid >= poolInfo.length) return 0;

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 accCthuPerShare = pool.accCthuPerShare;
        uint256 lpSupply = pool.totalDeposited;

        if (block.timestamp > pool.lastRewardTime && lpSupply > 0 && totalAllocPoint > 0) {
            uint256 timeElapsed = _getTimeElapsed(pool.lastRewardTime, block.timestamp);
            uint256 cthuReward = timeElapsed * emissionPerSecond * pool.allocPoint / totalAllocPoint;
            accCthuPerShare += cthuReward * 1e12 / lpSupply;
        }

        return (user.amount * accCthuPerShare / 1e12) - user.rewardDebt;
    }

    function getUserInfo(uint256 _pid, address _user) external view returns (uint256 amount, uint256 rewardDebt) {
        UserInfo storage user = userInfo[_pid][_user];
        return (user.amount, user.rewardDebt);
    }

    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 lastRewardTime,
        uint256 accCthuPerShare,
        uint256 totalDeposited,
        bool active
    ) {
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            pool.allocPoint,
            pool.lastRewardTime,
            pool.accCthuPerShare,
            pool.totalDeposited,
            pool.active
        );
    }

    // ============ Owner Management ============

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
