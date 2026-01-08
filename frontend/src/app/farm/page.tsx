'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { TerminalLog } from '@/components/terminal/TerminalLog'
import { StickyPanel } from '@/components/StickyPanel'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseEther, formatEther } from 'viem'
import { CONTRACTS } from '@/config/contracts'

// ABIs
const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

const FARM_ABI = [
  { name: 'deposit', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'withdraw', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'harvest', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'pendingReward', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_user', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'getUserInfo', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_user', type: 'address' }], outputs: [{ name: 'amount', type: 'uint256' }, { name: 'rewardDebt', type: 'uint256' }], stateMutability: 'view' },
  { name: 'getPoolInfo', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }], outputs: [{ name: 'lpToken', type: 'address' }, { name: 'allocPoint', type: 'uint256' }, { name: 'lastRewardTime', type: 'uint256' }, { name: 'accCthuPerShare', type: 'uint256' }, { name: 'totalDeposited', type: 'uint256' }, { name: 'active', type: 'bool' }], stateMutability: 'view' },
] as const

// Farm start time - when the farm contract started emitting rewards
// CthuFarmV3 started on December 27, 2025 at 04:43:03 GMT
const FARM_START_TIME = 1766810583

// Emission schedule
const YEAR_DURATION = 365.25 * 24 * 60 * 60 // seconds in a year
const EMISSIONS = [
  { year: 1, total: 400_000_000, rate: 12.68 },
  { year: 2, total: 200_000_000, rate: 6.34 },
  { year: 3, total: 100_000_000, rate: 3.17 },
  { year: 4, total: 185_000_000, rate: 5.86 },
]
const TOTAL_REWARDS = 885_000_000

const POOLS = [
  { id: 0, name: 'CTHU/MONAD', weight: 55, status: 'ACTIVE', lpToken: CONTRACTS.mainnet.CTHU_MONAD_PAIR },
  { id: 1, name: 'CTHU/USDT0', weight: 28, status: 'ACTIVE', lpToken: CONTRACTS.mainnet.CTHU_USDT_PAIR },
  { id: 2, name: 'MONAD/USDT0', weight: 17, status: 'ACTIVE', lpToken: CONTRACTS.mainnet.MONAD_USDT_PAIR },
]

// ASCII progress bar generator
function AsciiProgressBar({ percent, width = 20, filledChar = '█', emptyChar = '░' }: {
  percent: number
  width?: number
  filledChar?: string
  emptyChar?: string
}) {
  const filled = Math.floor((percent / 100) * width)
  const empty = width - filled
  return (
    <span className="font-mono">
      [{filledChar.repeat(filled)}{emptyChar.repeat(empty)}]
    </span>
  )
}

export default function FarmPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const { isConnected, address } = useAccount()
  const [selectedPool, setSelectedPool] = useState<number | null>(null)
  const [logs, setLogs] = useState<string[]>(['Farm module loaded.', 'Fetching pool data...'])
  const [currentYear, setCurrentYear] = useState(1)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [actionMode, setActionMode] = useState<'stake' | 'unstake' | null>(null)

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-6), msg])

  const contracts = CONTRACTS.mainnet
  const FARM_ADDRESS = contracts.FARM as `0x${string}`

  // Get LP token address for selected pool
  const selectedPoolData = selectedPool !== null ? POOLS[selectedPool] : null
  const lpTokenAddress = selectedPoolData?.lpToken as `0x${string}` | undefined

  // Read: User's LP token balance
  const { data: lpBalance, refetch: refetchLpBalance } = useReadContract({
    address: lpTokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!lpTokenAddress },
  })

  // Read: LP token allowance for farm
  const { data: lpAllowance, refetch: refetchAllowance } = useReadContract({
    address: lpTokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, FARM_ADDRESS] : undefined,
    query: { enabled: !!address && !!lpTokenAddress },
  })

  // Read: User's staked amount in selected pool
  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: FARM_ADDRESS,
    abi: FARM_ABI,
    functionName: 'getUserInfo',
    args: selectedPool !== null && address ? [BigInt(selectedPool), address] : undefined,
    query: { enabled: selectedPool !== null && !!address },
  })

  // Read: Pending rewards for selected pool
  const { data: pendingRewards, refetch: refetchPending } = useReadContract({
    address: FARM_ADDRESS,
    abi: FARM_ABI,
    functionName: 'pendingReward',
    args: selectedPool !== null && address ? [BigInt(selectedPool), address] : undefined,
    query: { enabled: selectedPool !== null && !!address },
  })

  // Read: Pool info (for TVL)
  const { data: poolInfo } = useReadContract({
    address: FARM_ADDRESS,
    abi: FARM_ABI,
    functionName: 'getPoolInfo',
    args: selectedPool !== null ? [BigInt(selectedPool)] : undefined,
    query: { enabled: selectedPool !== null },
  })

  // Read: Actual CTHU remaining in farm contract (to calculate real farmed amount)
  const { data: farmCthuBalance, refetch: refetchFarmBalance } = useReadContract({
    address: contracts.CTHUCOIN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [FARM_ADDRESS],
  })

  // Calculate actual farmed CTHU (distributed to users)
  const actualFarmedCthu = farmCthuBalance !== undefined
    ? TOTAL_REWARDS - Number(formatEther(farmCthuBalance as bigint))
    : 0

  // Write: Approve LP tokens
  const { writeContract: approveLp, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  // Write: Deposit (stake)
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract()
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash })

  // Write: Withdraw (unstake)
  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract()
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash })

  // Write: Harvest rewards
  const { writeContract: harvest, data: harvestHash, isPending: isHarvesting } = useWriteContract()
  const { isLoading: isHarvestConfirming, isSuccess: isHarvestSuccess } = useWaitForTransactionReceipt({ hash: harvestHash })

  // Derived values
  const stakedAmount = userInfo ? (userInfo as [bigint, bigint])[0] : 0n
  const pendingCthu = pendingRewards as bigint | undefined
  const poolTvl = poolInfo ? (poolInfo as [string, bigint, bigint, bigint, bigint, boolean])[4] : 0n
  const needsApproval = lpAllowance !== undefined && stakeAmount
    ? (lpAllowance as bigint) < parseEther(stakeAmount || '0')
    : false

  const isLoading = isApproving || isApproveConfirming || isDepositing || isDepositConfirming ||
                    isWithdrawing || isWithdrawConfirming || isHarvesting || isHarvestConfirming

  // Effect: Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      addLog('Approval confirmed!')
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  // Effect: Handle deposit success
  useEffect(() => {
    if (isDepositSuccess) {
      addLog(`Staked ${stakeAmount} LP tokens!`)
      setStakeAmount('')
      setActionMode(null)
      refetchUserInfo()
      refetchLpBalance()
      refetchPending()
    }
  }, [isDepositSuccess, stakeAmount, refetchUserInfo, refetchLpBalance, refetchPending])

  // Effect: Handle withdraw success
  useEffect(() => {
    if (isWithdrawSuccess) {
      addLog(`Unstaked ${unstakeAmount} LP tokens!`)
      setUnstakeAmount('')
      setActionMode(null)
      refetchUserInfo()
      refetchLpBalance()
      refetchPending()
    }
  }, [isWithdrawSuccess, unstakeAmount, refetchUserInfo, refetchLpBalance, refetchPending])

  // Effect: Handle harvest success
  useEffect(() => {
    if (isHarvestSuccess) {
      addLog('Rewards harvested!')
      refetchPending()
      refetchUserInfo()
    }
  }, [isHarvestSuccess, refetchPending, refetchUserInfo])

  // Handlers
  const handleApprove = () => {
    if (!stakeAmount || !lpTokenAddress) return
    addLog(`Approving ${stakeAmount} LP...`)
    approveLp({
      address: lpTokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [FARM_ADDRESS, parseEther(stakeAmount)],
    })
  }

  const handleDeposit = () => {
    if (!stakeAmount || selectedPool === null) return
    addLog(`Staking ${stakeAmount} LP...`)
    deposit({
      address: FARM_ADDRESS,
      abi: FARM_ABI,
      functionName: 'deposit',
      args: [BigInt(selectedPool), parseEther(stakeAmount)],
    })
  }

  const handleWithdraw = () => {
    if (!unstakeAmount || selectedPool === null) return
    addLog(`Unstaking ${unstakeAmount} LP...`)
    withdraw({
      address: FARM_ADDRESS,
      abi: FARM_ABI,
      functionName: 'withdraw',
      args: [BigInt(selectedPool), parseEther(unstakeAmount)],
    })
  }

  const handleHarvest = () => {
    if (selectedPool === null) return
    addLog('Harvesting rewards...')
    harvest({
      address: FARM_ADDRESS,
      abi: FARM_ABI,
      functionName: 'harvest',
      args: [BigInt(selectedPool)],
    })
  }

  // Refresh pending rewards periodically
  useEffect(() => {
    if (selectedPool === null || !address) return
    const interval = setInterval(() => {
      refetchPending()
    }, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [selectedPool, address, refetchPending])

  // Refresh farm balance periodically (for accurate "CTHU farmed" display)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchFarmBalance()
    }, 5000) // Every 5 seconds for more real-time feel
    return () => clearInterval(interval)
  }, [refetchFarmBalance])

  // Calculate current year based on time elapsed
  useEffect(() => {
    const calculateCurrentYear = () => {
      const now = Date.now() / 1000
      const elapsed = Math.max(0, now - FARM_START_TIME)

      let yearNum = 1
      let remainingTime = elapsed
      for (let i = 0; i < EMISSIONS.length; i++) {
        if (remainingTime <= YEAR_DURATION) {
          yearNum = i + 1
          break
        } else {
          remainingTime -= YEAR_DURATION
          yearNum = i + 2
        }
      }
      setCurrentYear(Math.min(yearNum, 4))
    }

    calculateCurrentYear()
    const interval = setInterval(calculateCurrentYear, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black crt-effect overflow-visible">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <div className="p-6 font-mono text-base text-white flex justify-center overflow-visible">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-start gap-6 overflow-visible">
          {/* Left Panel - Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="text-gray-400 mb-1">CTHU-OS v0.6.6.6</div>
            <div className="text-gray-600 mb-4">{'='.repeat(40)}</div>

            <div className="mb-4">
              <Link href="/" className="text-gray-600 hover:text-emerald-600">{'<'} BACK TO MAIN</Link>
            </div>

            <div className="text-emerald-600 mb-4">ELDRITCH FARMS - STAKING MODULE</div>

            {/* Real-time Emission Counter */}
            <div className="mb-4 p-3 border border-emerald-900/50 bg-emerald-950/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-emerald-500 text-xs mb-1">CTHU FARMED</div>
                  <div className="text-emerald-400 text-2xl font-bold tabular-nums">
                    {actualFarmedCthu.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-500 text-xs mb-1">CTHU REMAINING</div>
                  <div className="text-amber-400 text-2xl font-bold tabular-nums">
                    {farmCthuBalance !== undefined
                      ? parseFloat(formatEther(farmCthuBalance as bigint)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : '---'
                    }
                  </div>
                </div>
              </div>
              <div className="text-gray-500 text-xs">
                <AsciiProgressBar percent={(actualFarmedCthu / TOTAL_REWARDS) * 100} width={40} />
                <span className="ml-2">{((actualFarmedCthu / TOTAL_REWARDS) * 100).toFixed(4)}%</span>
              </div>
              <div className="text-gray-700 text-xs mt-1">
                Emission rate: {EMISSIONS[currentYear - 1]?.rate || 0} CTHU/sec (Year {currentYear})
              </div>
            </div>

            {/* Farm Stats */}
            <div className="text-gray-500 mb-4 space-y-0.5 text-sm">
              <div>Total Value Locked: $---,---</div>
              <div>Current Emission:   {EMISSIONS[currentYear - 1]?.rate || 0} CTHU/sec (Year {currentYear})</div>
              <div>Your Total Staked:  $0.00</div>
              <div>Pending Rewards:    0.00 CTHU</div>
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Emission Schedule with Progress */}
            <div className="text-gray-400 mb-2">EMISSION SCHEDULE:</div>
            <div className="text-gray-600 text-sm mb-4 space-y-2">
              {(() => {
                // Calculate how much has been farmed per year based on actual total
                let remainingFarmed = actualFarmedCthu

                return EMISSIONS.map((emission) => {
                  const isCurrent = currentYear === emission.year
                  const isPast = currentYear > emission.year

                  // Calculate this year's farmed amount
                  let yearFarmed = 0
                  let yearRemaining = emission.total

                  if (remainingFarmed > 0) {
                    yearFarmed = Math.min(remainingFarmed, emission.total)
                    yearRemaining = emission.total - yearFarmed
                    remainingFarmed -= yearFarmed
                  }

                  const progress = (yearFarmed / emission.total) * 100

                  return (
                    <div key={emission.year} className={`p-2 border ${isCurrent ? 'border-emerald-800 bg-emerald-950/30' : isPast ? 'border-gray-900' : 'border-gray-800'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={isCurrent ? 'text-emerald-400' : isPast ? 'text-gray-500' : 'text-gray-400'}>
                          YEAR {emission.year} {isCurrent && '◄ ACTIVE'}
                        </span>
                        <span className={`text-xs ${isPast ? 'text-gray-600' : isCurrent ? 'text-amber-500' : 'text-gray-500'}`}>
                          {yearRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} CTHU left
                        </span>
                      </div>
                      <div className="mb-1">
                        <AsciiProgressBar
                          percent={progress}
                          width={35}
                          filledChar={progress >= 100 ? '▓' : '█'}
                          emptyChar="░"
                        />
                        <span className="ml-2 text-xs text-gray-500">{progress.toFixed(2)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {emission.total.toLocaleString()} total @ {emission.rate} CTHU/sec
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Pool List */}
            <div className="text-gray-400 mb-2">AVAILABLE POOLS:</div>
            <div className="mb-4 space-y-2">
              {POOLS.map((pool) => {
                // Calculate pool's share based on actual farmed CTHU
                const poolFarmed = actualFarmedCthu * (pool.weight / 100)
                const poolTotal = TOTAL_REWARDS * (pool.weight / 100)
                const poolProgress = (poolFarmed / poolTotal) * 100
                const poolRemaining = poolTotal - poolFarmed

                return (
                  <div key={pool.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        setSelectedPool(selectedPool === pool.id ? null : pool.id)
                        addLog(`Selected pool: ${pool.name}`)
                      }}
                      className={`w-full text-left hover:bg-white/10 px-2 -mx-2 ${
                        selectedPool === pool.id ? 'text-white bg-white/10' : 'text-gray-400'
                      }`}
                    >
                      [{pool.id}] {pool.name.padEnd(12)} Weight: {pool.weight}% {pool.status}
                    </button>
                    <div className="text-xs text-gray-600 pl-4 flex items-center gap-2">
                      <AsciiProgressBar percent={poolProgress} width={15} />
                      <span className="tabular-nums">
                        {poolRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} CTHU left
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Pool Details */}
            {selectedPool !== null && (() => {
              const pool = POOLS[selectedPool]
              const poolFarmed = actualFarmedCthu * (pool.weight / 100)
              const poolTotal = TOTAL_REWARDS * (pool.weight / 100)
              const poolRemaining = poolTotal - poolFarmed
              const poolProgress = (poolFarmed / poolTotal) * 100
              const currentRate = (EMISSIONS[currentYear - 1]?.rate || 0) * (pool.weight / 100)

              // Format user data
              const userLpBalance = lpBalance ? formatEther(lpBalance as bigint) : '0'
              const userStaked = stakedAmount ? formatEther(stakedAmount) : '0'
              const userPending = pendingCthu ? formatEther(pendingCthu) : '0'
              const tvlFormatted = poolTvl ? formatEther(poolTvl) : '0'

              return (
              <>
                <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>
                <div className="text-gray-400 mb-2">POOL {selectedPool} - {pool.name}:</div>
                <div className="text-gray-500 text-xs mb-4 space-y-0.5">
                  <div>  TVL:           {parseFloat(tvlFormatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} LP</div>
                  <div>  Your LP:       {parseFloat(userLpBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                  <div className="text-emerald-500">  Staked:        {parseFloat(userStaked).toLocaleString(undefined, { maximumFractionDigits: 6 })} LP</div>
                  <div className="text-cyan-500">  Pending:       {parseFloat(userPending).toLocaleString(undefined, { maximumFractionDigits: 4 })} CTHU</div>
                  <div className="text-gray-600 mt-2">{'-'.repeat(30)}</div>
                  <div className="text-emerald-600">  Pool Allocation: {poolTotal.toLocaleString()} CTHU ({pool.weight}%)</div>
                  <div className="text-emerald-700">  Farmed:     {poolFarmed.toLocaleString(undefined, { maximumFractionDigits: 2 })} CTHU</div>
                  <div className="text-amber-600">  Remaining:  {poolRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} CTHU</div>
                  <div className="text-gray-500">  Rate:       {currentRate.toFixed(2)} CTHU/sec</div>
                  <div className="mt-1">
                    <AsciiProgressBar percent={poolProgress} width={25} />
                    <span className="ml-2 text-gray-500">{poolProgress.toFixed(4)}%</span>
                  </div>
                </div>

                {/* Actions */}
                {!isConnected ? (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button onClick={openConnectModal} className="text-yellow-500 hover:text-yellow-400">
                        {'>'} CONNECT WALLET
                      </button>
                    )}
                  </ConnectButton.Custom>
                ) : (
                  <div className="space-y-2">
                    {/* Stake Section */}
                    {actionMode === 'stake' ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">AMOUNT:</span>
                          <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-black border-b border-gray-700 px-2 py-0.5 text-white w-32 focus:border-emerald-500 focus:outline-none text-sm"
                            disabled={isLoading}
                          />
                          <span className="text-gray-600 text-xs">LP</span>
                          {lpBalance !== undefined && (lpBalance as bigint) > 0n && (
                            <button
                              onClick={() => setStakeAmount(formatEther(lpBalance as bigint))}
                              className="text-gray-600 text-xs hover:text-white"
                            >
                              [MAX]
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {needsApproval ? (
                            <button
                              onClick={handleApprove}
                              disabled={isLoading || !stakeAmount}
                              className="text-yellow-500 hover:text-yellow-400 disabled:text-gray-600"
                            >
                              {'>'} {isApproving || isApproveConfirming ? 'APPROVING...' : 'APPROVE'}
                            </button>
                          ) : (
                            <button
                              onClick={handleDeposit}
                              disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                              className="text-green-500 hover:text-green-400 disabled:text-gray-600"
                            >
                              {'>'} {isDepositing || isDepositConfirming ? 'STAKING...' : 'CONFIRM STAKE'}
                            </button>
                          )}
                          <button
                            onClick={() => { setActionMode(null); setStakeAmount('') }}
                            className="text-gray-500 hover:text-gray-400"
                            disabled={isLoading}
                          >
                            [CANCEL]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActionMode('stake')}
                        className="text-green-500 hover:text-green-400 block"
                        disabled={isLoading}
                      >
                        {'>'} STAKE LP
                      </button>
                    )}

                    {/* Unstake Section */}
                    {actionMode === 'unstake' ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">AMOUNT:</span>
                          <input
                            type="number"
                            value={unstakeAmount}
                            onChange={(e) => setUnstakeAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-black border-b border-gray-700 px-2 py-0.5 text-white w-32 focus:border-yellow-500 focus:outline-none text-sm"
                            disabled={isLoading}
                          />
                          <span className="text-gray-600 text-xs">LP</span>
                          {stakedAmount > 0n && (
                            <button
                              onClick={() => setUnstakeAmount(formatEther(stakedAmount))}
                              className="text-gray-600 text-xs hover:text-white"
                            >
                              [MAX]
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleWithdraw}
                            disabled={isLoading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                            className="text-yellow-500 hover:text-yellow-400 disabled:text-gray-600"
                          >
                            {'>'} {isWithdrawing || isWithdrawConfirming ? 'UNSTAKING...' : 'CONFIRM UNSTAKE'}
                          </button>
                          <button
                            onClick={() => { setActionMode(null); setUnstakeAmount('') }}
                            className="text-gray-500 hover:text-gray-400"
                            disabled={isLoading}
                          >
                            [CANCEL]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActionMode('unstake')}
                        className="text-yellow-500 hover:text-yellow-400 block"
                        disabled={isLoading || stakedAmount === 0n}
                      >
                        {'>'} UNSTAKE LP
                      </button>
                    )}

                    {/* Harvest Button */}
                    <button
                      onClick={handleHarvest}
                      disabled={isLoading || !pendingCthu || pendingCthu === 0n}
                      className="text-cyan-500 hover:text-cyan-400 block disabled:text-gray-600"
                    >
                      {'>'} {isHarvesting || isHarvestConfirming ? 'HARVESTING...' : 'HARVEST REWARDS'}
                      {pendingCthu && pendingCthu > 0n && (
                        <span className="text-cyan-700 ml-2">
                          ({parseFloat(formatEther(pendingCthu)).toFixed(2)} CTHU)
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )})()}

            {/* Prompt */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <span className="text-gray-500">farm@cthu-os:~$</span> <BlinkingCursor />
            </div>
          </div>

          {/* Right Panel - Terminal Logs */}
          <div className="hidden lg:block">
            <StickyPanel topOffset={24}>
              <TerminalLog
                title="farm.log"
                headerColor="text-emerald-600"
                headerTitle="FARM STATUS"
                staticInfo={[
                  { label: 'Contract', value: `${FARM_ADDRESS.slice(0, 10)}...${FARM_ADDRESS.slice(-8)}` },
                  { label: 'Alloc Points', value: '10000' },
                ]}
                logs={logs}
                statusText="Connected to Monad"
                statusColor="green"
              />
            </StickyPanel>
          </div>
          {/* Mobile version */}
          <div className="lg:hidden">
            <TerminalLog
              title="farm.log"
              headerColor="text-emerald-600"
              headerTitle="FARM STATUS"
              staticInfo={[
                { label: 'Contract', value: `${FARM_ADDRESS.slice(0, 10)}...${FARM_ADDRESS.slice(-8)}` },
                { label: 'Alloc Points', value: '10000' },
              ]}
              logs={logs}
              statusText="Connected to Monad"
              statusColor="green"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
