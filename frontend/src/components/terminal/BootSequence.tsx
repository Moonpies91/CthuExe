'use client'

import { useState, useEffect } from 'react'

interface BootSequenceProps {
  onComplete: () => void
}

const BOOT_MESSAGES = [
  'INITIALIZING CTHU-OS v0.6.6.6...',
  'LOADING ELDRITCH PROTOCOLS...',
  'CONNECTING TO THE VOID...',
  'AWAKENING ANCIENT CONTRACTS...',
  ' - CTHUCOIN.SOL... OK',
  ' - CTHUSWAP.SOL... OK',
  ' - CTHUFARM.SOL... OK',
  'SYNCHRONIZING WITH MONAD BLOCKCHAIN...',
  ' - BLOCK HEIGHT: SYNCING...',
  ' - CHAIN ID: 143',
  'ESTABLISHING CULT NETWORK...',
  'SUMMONING DEX LIQUIDITY POOLS...',
  'BINDING LAUNCHPAD RITUALS...',
  'CALIBRATING BONDING CURVES...',
  '',
  "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn",
  '',
  'SYSTEM READY.',
  'WELCOME, CULTIST.',
]

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showSkip, setShowSkip] = useState(false)

  useEffect(() => {
    // Show skip hint after a short delay
    const skipTimer = setTimeout(() => setShowSkip(true), 1000)

    // Progress through boot messages
    if (visibleLines < BOOT_MESSAGES.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1)
      }, 150 + Math.random() * 100)
      return () => {
        clearTimeout(timer)
        clearTimeout(skipTimer)
      }
    } else {
      // Auto-complete after showing all messages
      const completeTimer = setTimeout(onComplete, 1500)
      return () => {
        clearTimeout(completeTimer)
        clearTimeout(skipTimer)
      }
    }
  }, [visibleLines, onComplete])

  // Handle skip
  useEffect(() => {
    const handleKeyPress = () => onComplete()
    const handleClick = () => onComplete()

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('click', handleClick)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-black p-4 font-mono text-green-500 text-sm">
      {/* Boot messages */}
      <div className="max-w-2xl">
        {BOOT_MESSAGES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${
              line.startsWith(' -') ? 'ml-4 text-green-600' : ''
            } ${
              line.includes("Ph'nglui") ? 'text-red-500 italic mt-2' : ''
            } ${
              line === 'SYSTEM READY.' || line === 'WELCOME, CULTIST.'
                ? 'text-white font-bold'
                : ''
            }`}
          >
            {line || '\u00A0'}
          </div>
        ))}

        {/* Cursor */}
        {visibleLines < BOOT_MESSAGES.length && (
          <span className="animate-pulse">█</span>
        )}
      </div>

      {/* Skip hint */}
      {showSkip && (
        <div className="fixed bottom-4 right-4 text-gray-600 text-xs animate-pulse">
          [Press any key to skip]
        </div>
      )}
    </div>
  )
}
