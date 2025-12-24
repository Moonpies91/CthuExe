'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BootSequence } from '@/components/terminal/BootSequence'
import { Navigation } from '@/components/common/Navigation'
import { useBootSequence } from '@/hooks/useBootSequence'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

const MENU_ITEMS = [
  {
    id: 'swap',
    label: 'SWAP',
    description: 'Trade tokens on CthuSwap',
    href: '/swap',
    color: 'text-cthu-green',
  },
  {
    id: 'liquidity',
    label: 'LIQUIDITY',
    description: 'Provide liquidity to earn fees',
    href: '/liquidity',
    color: 'text-cthu-cyan',
  },
  {
    id: 'farm',
    label: 'ELDRITCH FARMS',
    description: 'Stake LP tokens for CTHU rewards',
    href: '/farm',
    color: 'text-cthu-purple',
  },
  {
    id: 'launchpad',
    label: 'CULTIST LAUNCHPAD',
    description: 'Summon and trade new tokens',
    href: '/launchpad',
    color: 'text-yellow-500',
  },
  {
    id: 'leaderboard',
    label: 'LEADERBOARD',
    description: 'Weekly burn rankings',
    href: '/leaderboard',
    color: 'text-red-500',
  },
]

export default function HomePage() {
  const { showBoot, completeBoot, isLoaded: bootLoaded } = useBootSequence()
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode, toggleSanityMode, isLoaded: sanityLoaded } = useSanityMode()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Don't render until client-side checks are complete
  if (!bootLoaded || !sanityLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cthu-green animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cthu-black crt-effect">
      <Scanlines />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      {showBoot ? (
        <BootSequence onComplete={completeBoot} />
      ) : (
        <>
          <Navigation />

          <main className="max-w-4xl mx-auto px-4 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1
                className="text-4xl md:text-6xl font-bold text-cthu-green mb-4 glitch"
                data-text="CTHUCOIN"
              >
                CTHUCOIN
              </h1>
              <p className="text-gray-400 text-lg mb-2">
                A Lovecraftian DeFi Ecosystem on Monad
              </p>
              <p className="text-cthu-purple text-sm italic">
                Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn
              </p>
            </motion.div>

            {/* Menu Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              {MENU_ITEMS.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={item.href}>
                    <div
                      className={`terminal-card group cursor-pointer transition-all duration-200 ${
                        hoveredItem === item.id ? 'border-cthu-green' : ''
                      }`}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-cthu-green">&gt;</span>
                        <span className={`font-bold ${item.color} group-hover:animate-pulse`}>
                          {item.label}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm pl-6">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="terminal-card"
            >
              <div className="text-cthu-green mb-4">&gt; PROTOCOL STATS</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">$--</div>
                  <div className="text-xs text-gray-500">TVL</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cthu-green">--</div>
                  <div className="text-xs text-gray-500">CTHU BURNED</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cthu-cyan">--</div>
                  <div className="text-xs text-gray-500">TOKENS LAUNCHED</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cthu-purple">--</div>
                  <div className="text-xs text-gray-500">CULTISTS</div>
                </div>
              </div>
            </motion.div>

            {/* Sanity Mode Toggle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-center"
            >
              <button
                onClick={toggleSanityMode}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                {sanityMode ? '[SANITY MODE: ON]' : '[SANITY MODE: OFF]'}
                <span className="ml-2 text-gray-700">
                  {sanityMode ? 'Click to embrace the madness' : 'Click for reduced effects'}
                </span>
              </button>
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-800 py-6 text-center text-gray-600 text-xs">
            <p>CTHUCOIN &copy; 2025 | Built on Monad</p>
            <p className="mt-1">
              That is not dead which can eternal lie, and with strange aeons even death may die.
            </p>
          </footer>
        </>
      )}
    </div>
  )
}
