'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { Navigation } from '@/components/common/Navigation'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

// Placeholder tokens for UI
const PLACEHOLDER_TOKENS = [
  {
    address: '0x1234...5678',
    name: 'Elder Token',
    symbol: 'ELDER',
    raised: '12,500',
    progress: 25,
    graduated: false,
  },
  {
    address: '0x2345...6789',
    name: 'Void Coin',
    symbol: 'VOID',
    raised: '45,000',
    progress: 90,
    graduated: false,
  },
  {
    address: '0x3456...7890',
    name: 'Deep One',
    symbol: 'DEEP',
    raised: '50,000',
    progress: 100,
    graduated: true,
  },
]

export default function LaunchpadPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [filter, setFilter] = useState<'all' | 'active' | 'graduated'>('all')

  const filteredTokens = PLACEHOLDER_TOKENS.filter((token) => {
    if (filter === 'active') return !token.graduated
    if (filter === 'graduated') return token.graduated
    return true
  })

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
            <h1 className="text-2xl font-bold text-yellow-500 mb-2">
              &gt; CULTIST LAUNCHPAD
            </h1>
            <p className="text-gray-500 text-sm">
              Summon and trade tokens on the bonding curve
            </p>
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
            <div className="flex gap-4">
              <div className="terminal-card text-center px-6">
                <div className="text-xl font-bold text-cthu-cyan">--</div>
                <div className="text-xs text-gray-500">TOKENS LAUNCHED</div>
              </div>
              <div className="terminal-card text-center px-6">
                <div className="text-xl font-bold text-cthu-green">--</div>
                <div className="text-xs text-gray-500">GRADUATED</div>
              </div>
              <div className="terminal-card text-center px-6">
                <div className="text-xl font-bold text-cthu-purple">--</div>
                <div className="text-xs text-gray-500">CTHU BURNED</div>
              </div>
            </div>

            <Link href="/launchpad/summon">
              <button className="terminal-button">
                + SUMMON TOKEN
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {(['all', 'active', 'graduated'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs border ${
                  filter === f
                    ? 'border-cthu-green text-cthu-green'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Token Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredTokens.length === 0 ? (
              <div className="col-span-2 terminal-card text-center py-12">
                <p className="text-gray-500">No tokens found</p>
              </div>
            ) : (
              filteredTokens.map((token, index) => (
                <motion.div
                  key={token.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/launchpad/${token.address}`}>
                    <div className="terminal-card cursor-pointer hover:border-cthu-green transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-white">
                            {token.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${token.symbol}
                          </div>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 ${
                            token.graduated
                              ? 'bg-cthu-green/20 text-cthu-green'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                        >
                          {token.graduated ? 'GRADUATED' : 'ACTIVE'}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-white">{token.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              token.graduated ? 'bg-cthu-green' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${token.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Raised</span>
                        <span className="text-cthu-cyan">
                          {token.raised} MONAD
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          {/* Launch Info */}
          <div className="mt-8 terminal-card">
            <div className="text-cthu-green mb-3">&gt; LAUNCH INFO</div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Launch Fee</div>
                <div className="text-white">100 MONAD (burned as CTHU)</div>
              </div>
              <div>
                <div className="text-gray-500">Graduation Threshold</div>
                <div className="text-white">$50,000 USD equivalent</div>
              </div>
              <div>
                <div className="text-gray-500">Token Distribution</div>
                <div className="text-white">80% Sale | 15% LP | 5% Creator</div>
              </div>
              <div>
                <div className="text-gray-500">LP Tokens</div>
                <div className="text-white">Burned on graduation</div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
