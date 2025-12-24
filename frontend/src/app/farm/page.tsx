'use client'

import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { Navigation } from '@/components/common/Navigation'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useAccount } from 'wagmi'

const POOLS = [
  {
    id: 0,
    name: 'CTHU/MONAD',
    weight: '50%',
    apr: '--',
    tvl: '--',
    earned: '--',
    staked: '--',
  },
  {
    id: 1,
    name: 'CTHU/USDT',
    weight: '25%',
    apr: '--',
    tvl: '--',
    earned: '--',
    staked: '--',
  },
  {
    id: 2,
    name: 'MONAD/USDT',
    weight: '15%',
    apr: '--',
    tvl: '--',
    earned: '--',
    staked: '--',
  },
  {
    id: 3,
    name: 'GRADUATED',
    weight: '10%',
    apr: '--',
    tvl: '--',
    earned: '--',
    staked: '--',
  },
]

export default function FarmPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-cthu-black crt-effect">
      <Scanlines />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-cthu-purple mb-2">
              &gt; ELDRITCH FARMS
            </h1>
            <p className="text-gray-500 text-sm">
              Stake LP tokens to earn CTHU rewards
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="terminal-card text-center">
              <div className="text-xl font-bold text-white">--</div>
              <div className="text-xs text-gray-500">TOTAL TVL</div>
            </div>
            <div className="terminal-card text-center">
              <div className="text-xl font-bold text-cthu-green">--</div>
              <div className="text-xs text-gray-500">CTHU/SEC</div>
            </div>
            <div className="terminal-card text-center">
              <div className="text-xl font-bold text-cthu-cyan">--</div>
              <div className="text-xs text-gray-500">YOUR STAKED</div>
            </div>
            <div className="terminal-card text-center">
              <div className="text-xl font-bold text-cthu-purple">--</div>
              <div className="text-xs text-gray-500">PENDING REWARDS</div>
            </div>
          </div>

          {/* Emission Schedule */}
          <div className="terminal-card mb-8">
            <div className="text-cthu-green mb-3">&gt; EMISSION SCHEDULE</div>
            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              <div>
                <div className="text-gray-500">YEAR 1</div>
                <div className="text-white">400M CTHU</div>
                <div className="text-cthu-green">12.68/sec</div>
              </div>
              <div>
                <div className="text-gray-500">YEAR 2</div>
                <div className="text-white">200M CTHU</div>
                <div className="text-gray-400">6.34/sec</div>
              </div>
              <div>
                <div className="text-gray-500">YEAR 3</div>
                <div className="text-white">100M CTHU</div>
                <div className="text-gray-400">3.17/sec</div>
              </div>
              <div>
                <div className="text-gray-500">YEAR 4</div>
                <div className="text-white">185M CTHU</div>
                <div className="text-gray-400">5.86/sec</div>
              </div>
            </div>
          </div>

          {/* Pool List */}
          <div className="space-y-4">
            {POOLS.map((pool, index) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="terminal-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Pool Info */}
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-bold text-white">{pool.name}</div>
                      <div className="text-xs text-gray-500">
                        Weight: {pool.weight}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-center text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">APR</div>
                      <div className="text-cthu-green">{pool.apr}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">TVL</div>
                      <div className="text-white">{pool.tvl}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">EARNED</div>
                      <div className="text-cthu-purple">{pool.earned}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">STAKED</div>
                      <div className="text-cthu-cyan">{pool.staked}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="terminal-button text-xs px-4"
                      disabled={!isConnected}
                    >
                      STAKE
                    </button>
                    <button
                      className="terminal-button text-xs px-4"
                      disabled={!isConnected}
                    >
                      HARVEST
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
