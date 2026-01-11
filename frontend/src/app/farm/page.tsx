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
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS } from '@/config/contracts'

// ABIs - Read only
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

const FARM_ABI = [
  { name: 'getPoolInfo', type: 'function', inputs: [{ name: '_pid', type: 'uint256' }], outputs: [{ name: 'lpToken', type: 'address' }, { name: 'allocPoint', type: 'uint256' }, { name: 'lastRewardTime', type: 'uint256' }, { name: 'accCthuPerShare', type: 'uint256' }, { name: 'totalDeposited', type: 'uint256' }, { name: 'active', type: 'bool' }], stateMutability: 'view' },
] as const

// Farm start time - when the farm contract started emitting rewards
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
  const [selectedPool, setSelectedPool] = useState<number | null>(null)
  const [logs] = useState<string[]>(['The void stirs...', 'Observation mode active.', 'Gazing into the abyss...'])
  const [currentYear, setCurrentYear] = useState(1)

  const contracts = CONTRACTS.mainnet
  const FARM_ADDRESS = contracts.FARM as `0x${string}`

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

  // Derived values
  const poolTvl = poolInfo ? (poolInfo as [string, bigint, bigint, bigint, bigint, boolean])[4] : 0n

  // Refresh farm balance periodically (for accurate "CTHU farmed" display)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchFarmBalance()
    }, 5000)
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
    const interval = setInterval(calculateCurrentYear, 60000)
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

            <div className="text-purple-500 mb-2">THE VOID</div>
            <div className="text-gray-600 text-xs mb-4">[OBSERVATION MODE]</div>

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

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Emission Schedule with Progress */}
            <div className="text-gray-400 mb-2">EMISSION SCHEDULE:</div>
            <div className="text-gray-600 text-sm mb-4 space-y-2">
              {(() => {
                let remainingFarmed = actualFarmedCthu

                return EMISSIONS.map((emission) => {
                  const isCurrent = currentYear === emission.year
                  const isPast = currentYear > emission.year

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
            <div className="text-gray-400 mb-2">POOL STATUS:</div>
            <div className="mb-4 space-y-2">
              {POOLS.map((pool) => {
                const poolFarmed = actualFarmedCthu * (pool.weight / 100)
                const poolTotal = TOTAL_REWARDS * (pool.weight / 100)
                const poolProgress = (poolFarmed / poolTotal) * 100
                const poolRemaining = poolTotal - poolFarmed

                return (
                  <div key={pool.id} className="space-y-0.5">
                    <button
                      onClick={() => setSelectedPool(selectedPool === pool.id ? null : pool.id)}
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

            {/* Selected Pool Details - Read Only */}
            {selectedPool !== null && (() => {
              const pool = POOLS[selectedPool]
              const poolFarmed = actualFarmedCthu * (pool.weight / 100)
              const poolTotal = TOTAL_REWARDS * (pool.weight / 100)
              const poolRemaining = poolTotal - poolFarmed
              const poolProgress = (poolFarmed / poolTotal) * 100
              const currentRate = (EMISSIONS[currentYear - 1]?.rate || 0) * (pool.weight / 100)
              const tvlFormatted = poolTvl ? formatEther(poolTvl) : '0'

              return (
              <>
                <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>
                <div className="text-gray-400 mb-2">POOL {selectedPool} - {pool.name}:</div>
                <div className="text-gray-500 text-xs mb-4 space-y-0.5">
                  <div>  TVL:           {parseFloat(tvlFormatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} LP</div>
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

                {/* Info notice instead of actions */}
                <div className="text-gray-600 text-xs p-2 border border-gray-800">
                  This is a read-only status display. Contract interactions are not available through this interface.
                </div>
              </>
            )})()}

            {/* Prompt */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <span className="text-gray-500">monitor@cthu-os:~$</span> <BlinkingCursor />
            </div>
          </div>

          {/* Right Panel - Terminal Logs */}
          <div className="hidden lg:block">
            <StickyPanel topOffset={24}>
              <TerminalLog
                title="void.log"
                headerColor="text-purple-500"
                headerTitle="THE VOID"
                staticInfo={[
                  { label: 'Mode', value: 'OBSERVE' },
                  { label: 'Sigil', value: `${FARM_ADDRESS.slice(0, 10)}...${FARM_ADDRESS.slice(-8)}` },
                ]}
                logs={logs}
                statusText="Watching"
                statusColor="purple"
              />
            </StickyPanel>
          </div>
          {/* Mobile version */}
          <div className="lg:hidden">
            <TerminalLog
              title="void.log"
              headerColor="text-purple-500"
              headerTitle="THE VOID"
              staticInfo={[
                { label: 'Mode', value: 'OBSERVE' },
                { label: 'Sigil', value: `${FARM_ADDRESS.slice(0, 10)}...${FARM_ADDRESS.slice(-8)}` },
              ]}
              logs={logs}
              statusText="Watching"
              statusColor="purple"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
