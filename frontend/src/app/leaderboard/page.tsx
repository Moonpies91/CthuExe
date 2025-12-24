'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { Navigation } from '@/components/common/Navigation'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

const PLACEHOLDER_RANKINGS = [
  { rank: 1, token: 'Elder Token', symbol: 'ELDER', burned: '125,000' },
  { rank: 2, token: 'Void Coin', symbol: 'VOID', burned: '98,500' },
  { rank: 3, token: 'Deep One', symbol: 'DEEP', burned: '76,200' },
  { rank: 4, token: 'Shoggoth', symbol: 'SHOG', burned: '54,100' },
  { rank: 5, token: 'Nyarlathotep', symbol: 'NYAR', burned: '42,800' },
]

export default function LeaderboardPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week

  return (
    <div className="min-h-screen bg-cthu-black crt-effect">
      <Scanlines />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-red-500 mb-2">
              &gt; WEEKLY LEADERBOARD
            </h1>
            <p className="text-gray-500 text-sm">
              Burn CTHU to promote tokens and climb the ranks
            </p>
          </div>

          {/* Week Selector */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
              className="terminal-button text-xs px-3"
              disabled={selectedWeek === 0}
            >
              &lt; PREV
            </button>
            <div className="terminal-card px-6 py-2 text-center">
              <div className="text-xs text-gray-500">WEEK</div>
              <div className="text-cthu-green font-bold">
                {selectedWeek === 0 ? 'CURRENT' : `#${selectedWeek}`}
              </div>
            </div>
            <button
              onClick={() => setSelectedWeek(selectedWeek + 1)}
              className="terminal-button text-xs px-3"
              disabled={selectedWeek === 0}
            >
              NEXT &gt;
            </button>
          </div>

          {/* Time Remaining */}
          {selectedWeek === 0 && (
            <div className="text-center mb-8">
              <div className="text-xs text-gray-500 mb-1">RESETS IN</div>
              <div className="text-2xl font-bold text-cthu-cyan font-mono">
                --:--:--
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="space-y-3">
            {PLACEHOLDER_RANKINGS.map((item, index) => (
              <motion.div
                key={item.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`terminal-card flex items-center gap-4 ${
                  item.rank <= 3 ? 'border-yellow-500/50' : ''
                }`}
              >
                {/* Rank */}
                <div
                  className={`w-12 h-12 flex items-center justify-center font-bold text-xl ${
                    item.rank === 1
                      ? 'text-yellow-400'
                      : item.rank === 2
                        ? 'text-gray-300'
                        : item.rank === 3
                          ? 'text-orange-400'
                          : 'text-gray-500'
                  }`}
                >
                  #{item.rank}
                </div>

                {/* Token Info */}
                <div className="flex-1">
                  <div className="font-bold text-white">{item.token}</div>
                  <div className="text-xs text-gray-500">${item.symbol}</div>
                </div>

                {/* Burned Amount */}
                <div className="text-right">
                  <div className="text-cthu-purple font-bold">
                    {item.burned}
                  </div>
                  <div className="text-xs text-gray-500">CTHU BURNED</div>
                </div>

                {/* Burn Button */}
                <button className="terminal-button text-xs">
                  BURN
                </button>
              </motion.div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-8 terminal-card">
            <div className="text-cthu-green mb-3">&gt; HOW IT WORKS</div>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Anyone can burn CTHU for any token</li>
              <li>• Rankings reset every Monday 00:00 UTC</li>
              <li>• Top 10 tokens displayed on leaderboard</li>
              <li>• Historical rankings preserved forever</li>
              <li>• 100% of burned CTHU is permanently destroyed</li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
