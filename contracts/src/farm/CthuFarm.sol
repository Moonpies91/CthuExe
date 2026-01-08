// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CthuFarm
 * @notice Yield farming contract for CthuCoin ecosystem
 * @dev MasterChef-style farming with immutable pool weights and 4-year emission schedule
 *
 * IMPORTANT SAFEGUARDS:
 * - startTime is configurable until finalized
 * - Pools MUST be added before finalizing
 * - Emergency token recovery available before farming starts
 *
 * Pool Configuration (immutable after finalization):
 * - Pool 0: CTHU/MONAD LP - 55% weight
 * - Pool 1: CTHU/USDT LP - 28% weight
 * - Pool 2: MONAD/USDT LP - 17% weight
 *
 * Emission Schedule:
 * - Year 1: 400,000,000 CTHU (12.68 per second)
 * - Year 2: 200,000,000 CTHU (6.34 per second)
 * - Year 3: 100,000,000 CTHU (3.17 per second)
 * - Year 4: 185,000,000 CTHU (5.86 per second)
 * - Total:  885,000,000 CTHU
 */
contract CthuFarm is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct UserInfo {
        uint256 amount;     // LP tokens deposited
        uint256 rewardDebt; // Reward debt for accurate reward calculation
    }

    struct PoolInfo {
        IERC20 lpToken;           // LP token contract
        uint256 allocPoint;       // Allocation points for this pool
        uint256 lastRewardTime;   // Last timestamp rewards were calculated
        uint256 accCthuPerShare;  // Accumulated CTHU per share (scaled by 1e12)
        uint256 totalDeposited;   // Total LP tokens in pool
    }

    // ============ Constants ============

    uint256 public constant TOTAL_ALLOC_POINTS = 10000; // 100% = 10000 basis points

    // Pool allocation points (immutable)
    uint256 public constant POOL_CTHU_MONAD_ALLOC = 5500;  // 55%
    uint256 public constant POOL_CTHU_USDT_ALLOC = 2800;   // 28%
    uint256 public constant POOL_MONAD_USDT_ALLOC = 1700;  // 17%

    // Emission schedule (per second)
    uint256 public constant YEAR_1_EMISSION = 12680000000000000000; // ~12.68 CTHU/sec
    uint256 public constant YEAR_2_EMISSION = 6340000000000000000;  // ~6.34 CTHU/sec
    uint256 public constant YEAR_3_EMISSION = 3170000000000000000;  // ~3.17 CTHU/sec
    uint256 public constant YEAR_4_EMISSION = 5860000000000000000;  // ~5.86 CTHU/sec

    uint256 public constant YEAR_DURATION = 365 days;

    // ============ State Variables ============

    IERC20 public immutable cthu;

    // Owner for admin functions
    address public owner;

    // Start/end times - configurable until finalized
    uint256 public startTime;
    uint256 public endTime;
    bool public startTimeFinalized;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // ============ Events ============

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event StartTimeSet(uint256 startTime, uint256 endTime);
    event StartTimeFinalized(uint256 startTime, uint256 poolCount);
    event EmergencyTokenRecovery(address indexed token, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "CthuFarm: Not owner");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Deploy the farming contract
     * @param _cthu CTHU token address
     * @dev startTime must be set separately via setStartTime() before finalization
     */
    constructor(address _cthu) {
        require(_cthu != address(0), "CthuFarm: Invalid CTHU");

        cthu = IERC20(_cthu);
        owner = msg.sender;

        // Initialize with placeholder times - must be set before finalization
        startTime = 0;
        endTime = 0;
        startTimeFinalized = false;
    }

    // ============ Owner Management ============

    /**
     * @notice Transfer ownership to a new address
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "CthuFarm: Invalid new owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    // ============ Start Time Management ============

    /**
     * @notice Set the farming start time (can only be called before finalization)
     * @param _startTime Timestamp when farming should begin
     */
    function setStartTime(uint256 _startTime) external onlyOwner {
        require(!startTimeFinalized, "CthuFarm: Start time already finalized");
        require(_startTime > block.timestamp, "CthuFarm: Must be in the future");

        startTime = _startTime;
        endTime = _startTime + (4 * YEAR_DURATION);

        emit StartTimeSet(_startTime, endTime);
    }

    /**
     * @notice Finalize the start time - locks pools and schedule permanently
     * @dev CRITICAL: Requires at least 1 pool to be configured
     */
    function finalizeStartTime() external onlyOwner {
        require(!startTimeFinalized, "CthuFarm: Already finalized");
        require(startTime > 0, "CthuFarm: Start time not set");
        require(startTime > block.timestamp, "CthuFarm: Start time must be in future");
        require(poolInfo.length > 0, "CthuFarm: No pools configured");

        startTimeFinalized = true;

        // Update all pools to use the finalized start time
        for (uint256 i = 0; i < poolInfo.length; i++) {
            poolInfo[i].lastRewardTime = startTime;
        }

        emit StartTimeFinalized(startTime, poolInfo.length);
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency token recovery - can only be used before farming starts or if no pools exist
     * @param _token Token address to recover
     * @param _amount Amount to recover
     */
    function emergencyRecoverTokens(address _token, uint256 _amount) external onlyOwner {
        require(
            !startTimeFinalized || block.timestamp < startTime || poolInfo.length == 0,
            "CthuFarm: Cannot recover during active farming"
        );

        IERC20(_token).safeTransfer(owner, _amount);
        emit EmergencyTokenRecovery(_token, _amount);
    }

    // ============ Pool Management ============

    /**
     * @notice Add a new LP pool (can only be called before finalization)
     * @param _lpToken LP token address
     * @param _allocPoint Allocation points for this pool
     */
    function addPool(address _lpToken, uint256 _allocPoint) external onlyOwner {
        require(!startTimeFinalized, "CthuFarm: Cannot add pools after finalization");
        require(_lpToken != address(0), "CthuFarm: Invalid LP token");

        // Verify total alloc points won't exceed limit
        uint256 currentTotal = 0;
        for (uint256 i = 0; i < poolInfo.length; i++) {
            currentTotal += poolInfo[i].allocPoint;
        }
        require(currentTotal + _allocPoint <= TOTAL_ALLOC_POINTS, "CthuFarm: Exceeds alloc limit");

        // Use placeholder lastRewardTime - will be updated on finalization
        poolInfo.push(PoolInfo({
            lpToken: IERC20(_lpToken),
            allocPoint: _allocPoint,
            lastRewardTime: startTime > 0 ? startTime : block.timestamp,
            accCthuPerShare: 0,
            totalDeposited: 0
        }));

        emit PoolAdded(poolInfo.length - 1, _lpToken, _allocPoint);
    }

    /**
     * @notice Returns the number of pools
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // ============ Reward Calculation ============

    /**
     * @notice Get the current emission rate per second
     * @return rate CTHU per second
     */
    function getEmissionRate() public view returns (uint256 rate) {
        if (!startTimeFinalized) return 0;
        if (block.timestamp < startTime) return 0;
        if (block.timestamp >= endTime) return 0;

        uint256 elapsed = block.timestamp - startTime;

        if (elapsed < YEAR_DURATION) {
            return YEAR_1_EMISSION;
        } else if (elapsed < 2 * YEAR_DURATION) {
            return YEAR_2_EMISSION;
        } else if (elapsed < 3 * YEAR_DURATION) {
            return YEAR_3_EMISSION;
        } else {
            return YEAR_4_EMISSION;
        }
    }

    /**
     * @notice Calculate pending CTHU rewards for a user
     * @param _pid Pool ID
     * @param _user User address
     * @return pending CTHU rewards
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256 pending) {
        if (_pid >= poolInfo.length) return 0;

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 accCthuPerShare = pool.accCthuPerShare;
        uint256 lpSupply = pool.totalDeposited;

        if (block.timestamp > pool.lastRewardTime && lpSupply != 0 && startTimeFinalized) {
            uint256 cthuReward = _calculateReward(pool.lastRewardTime, block.timestamp, pool.allocPoint);
            accCthuPerShare += (cthuReward * 1e12) / lpSupply;
        }

        pending = (user.amount * accCthuPerShare) / 1e12 - user.rewardDebt;
    }

    /**
     * @notice Calculate rewards for a time period
     */
    function _calculateReward(uint256 _from, uint256 _to, uint256 _allocPoint) internal view returns (uint256) {
        if (!startTimeFinalized) return 0;
        if (_from >= endTime) return 0;
        if (_to > endTime) _to = endTime;
        if (_from < startTime) _from = startTime;
        if (_to <= _from) return 0;

        uint256 totalReward = 0;
        uint256 currentTime = _from;

        // Calculate rewards year by year
        for (uint256 year = 0; year < 4; year++) {
            uint256 yearStart = startTime + (year * YEAR_DURATION);
            uint256 yearEnd = yearStart + YEAR_DURATION;

            if (currentTime >= yearEnd) continue;
            if (_to <= yearStart) break;

            uint256 periodStart = currentTime > yearStart ? currentTime : yearStart;
            uint256 periodEnd = _to < yearEnd ? _to : yearEnd;

            if (periodEnd > periodStart) {
                uint256 emission;
                if (year == 0) emission = YEAR_1_EMISSION;
                else if (year == 1) emission = YEAR_2_EMISSION;
                else if (year == 2) emission = YEAR_3_EMISSION;
                else emission = YEAR_4_EMISSION;

                totalReward += (periodEnd - periodStart) * emission;
            }

            currentTime = periodEnd;
        }

        return (totalReward * _allocPoint) / TOTAL_ALLOC_POINTS;
    }

    // ============ Core Functions ============

    /**
     * @notice Update reward variables for a pool
     * @param _pid Pool ID
     */
    function updatePool(uint256 _pid) public {
        require(startTimeFinalized, "CthuFarm: Not finalized");

        PoolInfo storage pool = poolInfo[_pid];

        if (block.timestamp <= pool.lastRewardTime) return;

        uint256 lpSupply = pool.totalDeposited;

        if (lpSupply == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }

        uint256 cthuReward = _calculateReward(pool.lastRewardTime, block.timestamp, pool.allocPoint);
        pool.accCthuPerShare += (cthuReward * 1e12) / lpSupply;
        pool.lastRewardTime = block.timestamp;
    }

    /**
     * @notice Update all pools
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; pid++) {
            updatePool(pid);
        }
    }

    /**
     * @notice Deposit LP tokens for CTHU rewards
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to deposit
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        require(startTimeFinalized, "CthuFarm: Not finalized");
        require(_pid < poolInfo.length, "CthuFarm: Invalid pool");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        // Harvest existing rewards
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accCthuPerShare) / 1e12 - user.rewardDebt;
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

        user.rewardDebt = (user.amount * pool.accCthuPerShare) / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice Withdraw LP tokens and harvest rewards
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to withdraw
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        require(startTimeFinalized, "CthuFarm: Not finalized");
        require(_pid < poolInfo.length, "CthuFarm: Invalid pool");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "CthuFarm: Insufficient balance");

        updatePool(_pid);

        // Harvest rewards
        uint256 pending = (user.amount * pool.accCthuPerShare) / 1e12 - user.rewardDebt;
        if (pending > 0) {
            _safeCthuTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }

        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalDeposited -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }

        user.rewardDebt = (user.amount * pool.accCthuPerShare) / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @notice Harvest rewards without withdrawing LP tokens
     * @param _pid Pool ID
     */
    function harvest(uint256 _pid) external nonReentrant {
        require(startTimeFinalized, "CthuFarm: Not finalized");
        require(_pid < poolInfo.length, "CthuFarm: Invalid pool");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = (user.amount * pool.accCthuPerShare) / 1e12 - user.rewardDebt;
        require(pending > 0, "CthuFarm: Nothing to harvest");

        user.rewardDebt = (user.amount * pool.accCthuPerShare) / 1e12;
        _safeCthuTransfer(msg.sender, pending);

        emit Harvest(msg.sender, _pid, pending);
    }

    /**
     * @notice Emergency withdraw without caring about rewards
     * @param _pid Pool ID
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        require(_pid < poolInfo.length, "CthuFarm: Invalid pool");

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

    /**
     * @notice Safe CTHU transfer (handles rounding)
     */
    function _safeCthuTransfer(address _to, uint256 _amount) internal {
        uint256 cthBal = cthu.balanceOf(address(this));
        if (_amount > cthBal) {
            cthu.safeTransfer(_to, cthBal);
        } else {
            cthu.safeTransfer(_to, _amount);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get user info for a pool
     * @param _pid Pool ID
     * @param _user User address
     * @return amount LP tokens deposited
     * @return rewardDebt Reward debt
     */
    function getUserInfo(uint256 _pid, address _user) external view returns (uint256 amount, uint256 rewardDebt) {
        UserInfo storage user = userInfo[_pid][_user];
        return (user.amount, user.rewardDebt);
    }

    /**
     * @notice Get farming statistics
     * @return currentEmission Current emission rate per second
     * @return totalPools Number of pools
     * @return farmingActive Whether farming is active
     * @return timeToStart Seconds until farming starts (0 if started)
     * @return timeToEnd Seconds until farming ends (0 if ended)
     */
    function getFarmingStats() external view returns (
        uint256 currentEmission,
        uint256 totalPools,
        bool farmingActive,
        uint256 timeToStart,
        uint256 timeToEnd
    ) {
        currentEmission = getEmissionRate();
        totalPools = poolInfo.length;
        farmingActive = startTimeFinalized && block.timestamp >= startTime && block.timestamp < endTime;
        timeToStart = startTimeFinalized && block.timestamp < startTime ? startTime - block.timestamp : 0;
        timeToEnd = startTimeFinalized && block.timestamp < endTime ? endTime - block.timestamp : 0;
    }

    /**
     * @notice Check if the farm is properly configured and ready to finalize
     * @return isReady Whether the farm can be finalized
     * @return poolCount Number of pools configured
     * @return startTimeSet Whether start time has been set
     * @return isFinalized Whether already finalized
     */
    function getConfigurationStatus() external view returns (
        bool isReady,
        uint256 poolCount,
        bool startTimeSet,
        bool isFinalized
    ) {
        poolCount = poolInfo.length;
        startTimeSet = startTime > 0;
        isFinalized = startTimeFinalized;
        isReady = poolCount > 0 && startTimeSet && startTime > block.timestamp && !isFinalized;
    }
}
