'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GlitchOverlayProps {
  madnessLevel: number // 0-5
  sanityMode?: boolean
}

export function GlitchOverlay({ madnessLevel, sanityMode = false }: GlitchOverlayProps) {
  const [glitchActive, setGlitchActive] = useState(false)
  const [vhsActive, setVhsActive] = useState(false)

  // Adjust intensity based on sanity mode
  const intensity = sanityMode ? madnessLevel * 0.25 : madnessLevel

  // Glitch intervals based on madness level
  const glitchIntervals = [60000, 30000, 15000, 10000, 5000, 2000]
  const glitchDurations = [100, 150, 200, 300, 400, 500]

  useEffect(() => {
    if (intensity === 0) return

    const interval = setInterval(() => {
      // Random chance to trigger glitch
      if (Math.random() < 0.3 + (intensity * 0.1)) {
        setGlitchActive(true)
        setTimeout(() => setGlitchActive(false), glitchDurations[Math.floor(intensity)])
      }

      // Random VHS tracking
      if (Math.random() < 0.1 + (intensity * 0.05)) {
        setVhsActive(true)
        setTimeout(() => setVhsActive(false), 500)
      }
    }, glitchIntervals[Math.floor(intensity)] || 60000)

    return () => clearInterval(interval)
  }, [intensity])

  const aberrationOffset = [1, 2, 3, 5, 8, 12][Math.floor(intensity)] || 1

  return (
    <>
      {/* Chromatic Aberration Layer */}
      <div
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          mixBlendMode: 'screen',
          opacity: intensity > 0 ? 0.1 + (intensity * 0.05) : 0,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg,
              rgba(255,0,0,${0.05 * intensity}) 0%,
              transparent 50%,
              rgba(0,255,255,${0.05 * intensity}) 100%)`,
            transform: `translateX(${aberrationOffset}px)`,
          }}
        />
      </div>

      {/* Glitch Flash */}
      <AnimatePresence>
        {glitchActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-50"
            style={{
              background: `linear-gradient(
                ${Math.random() * 360}deg,
                transparent,
                rgba(255,0,0,0.1),
                transparent,
                rgba(0,255,255,0.1),
                transparent
              )`,
            }}
          />
        )}
      </AnimatePresence>

      {/* VHS Tracking Lines */}
      <AnimatePresence>
        {vhsActive && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'linear' }}
            className="pointer-events-none fixed inset-x-0 z-50 h-8"
            style={{
              background: 'linear-gradient(transparent, rgba(255,255,255,0.1), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Noise Overlay */}
      {intensity >= 3 && (
        <div
          className="pointer-events-none fixed inset-0 z-40 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </>
  )
}
