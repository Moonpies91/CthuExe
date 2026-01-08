'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GlitchOverlayProps {
  madnessLevel: number // 0-4
  sanityMode?: boolean
}

// Per-level effect parameters from spec - increased chromatic aberration
const LEVEL_CONFIG = {
  0: { scanlineOpacity: 0.02, aberration: 3, glitchInterval: [55000, 65000], shake: 0, corruption: 0 },
  1: { scanlineOpacity: 0.05, aberration: 5, glitchInterval: [20000, 30000], shake: 2, corruption: 0 },
  2: { scanlineOpacity: 0.08, aberration: 8, glitchInterval: [8000, 15000], shake: 5, corruption: 0.02 },
  3: { scanlineOpacity: 0.12, aberration: 12, glitchInterval: [3000, 8000], shake: 8, corruption: 0.05 },
  4: { scanlineOpacity: 0.15, aberration: 18, glitchInterval: [1000, 3000], shake: 12, corruption: 0.1 },
} as const

function getRandomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function GlitchOverlay({ madnessLevel, sanityMode = false }: GlitchOverlayProps) {
  const [glitchActive, setGlitchActive] = useState(false)
  const [vhsActive, setVhsActive] = useState(false)
  const [shakeActive, setShakeActive] = useState(false)
  const [signalLoss, setSignalLoss] = useState(false)
  const [screenWarp, setScreenWarp] = useState({ x: 0, y: 0 })

  // Clamp level to 0-4
  const level = Math.min(Math.max(madnessLevel, 0), 4) as keyof typeof LEVEL_CONFIG
  const config = LEVEL_CONFIG[level]

  // Reduce effects in sanity mode
  const effectMultiplier = sanityMode ? 0.25 : 1
  const aberrationOffset = config.aberration * effectMultiplier
  const shakeAmount = config.shake * effectMultiplier

  // Glitch effect trigger
  const triggerGlitch = useCallback(() => {
    if (sanityMode && level < 2) return

    setGlitchActive(true)
    setTimeout(() => setGlitchActive(false), 100 + (level * 100))

    // Screen shake at level 1+
    if (shakeAmount > 0) {
      setShakeActive(true)
      setTimeout(() => setShakeActive(false), 200 + (level * 100))
    }
  }, [level, sanityMode, shakeAmount])

  // VHS tracking effect
  const triggerVHS = useCallback(() => {
    if (sanityMode || level < 1) return
    setVhsActive(true)
    setTimeout(() => setVhsActive(false), 300)
  }, [level, sanityMode])

  // Signal loss (black flash) at level 3+
  const triggerSignalLoss = useCallback(() => {
    if (sanityMode || level < 3) return
    if (Math.random() < 0.3) {
      setSignalLoss(true)
      setTimeout(() => setSignalLoss(false), 50 + Math.random() * 100)
    }
  }, [level, sanityMode])

  // Screen warp at level 3+
  useEffect(() => {
    if (sanityMode || level < 3) return

    const warpInterval = setInterval(() => {
      setScreenWarp({
        x: (Math.random() - 0.5) * level * 0.5,
        y: (Math.random() - 0.5) * level * 0.3,
      })
    }, 2000)

    return () => clearInterval(warpInterval)
  }, [level, sanityMode])

  // Main effect loop
  useEffect(() => {
    if (level === 0 && sanityMode) return

    const [minInterval, maxInterval] = config.glitchInterval
    let timeoutId: NodeJS.Timeout

    const scheduleNextGlitch = () => {
      const interval = getRandomInterval(
        minInterval * (sanityMode ? 4 : 1),
        maxInterval * (sanityMode ? 4 : 1)
      )

      timeoutId = setTimeout(() => {
        // Random chance to trigger effects
        if (Math.random() < 0.5 + (level * 0.1)) {
          triggerGlitch()
        }
        if (Math.random() < 0.2 + (level * 0.1)) {
          triggerVHS()
        }
        if (level >= 3) {
          triggerSignalLoss()
        }

        scheduleNextGlitch()
      }, interval)
    }

    scheduleNextGlitch()
    return () => clearTimeout(timeoutId)
  }, [level, sanityMode, config.glitchInterval, triggerGlitch, triggerVHS, triggerSignalLoss])

  return (
    <>
      {/* Screen Shake Container - wraps content via CSS */}
      <style jsx global>{`
        ${shakeActive ? `
          body {
            animation: screenShake 0.1s ease-in-out;
          }
          @keyframes screenShake {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(${-shakeAmount}px, ${shakeAmount * 0.5}px); }
            50% { transform: translate(${shakeAmount}px, ${-shakeAmount * 0.5}px); }
            75% { transform: translate(${-shakeAmount * 0.5}px, ${shakeAmount}px); }
          }
        ` : ''}

        ${screenWarp.x !== 0 || screenWarp.y !== 0 ? `
          main {
            transform: skew(${screenWarp.x}deg, ${screenWarp.y}deg);
            transition: transform 0.5s ease-out;
          }
        ` : ''}
      `}</style>

      {/* Subtle edge vignette only - chromatic aberration handled by CSS text-shadow */}
      {level >= 2 && (
        <div
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            mixBlendMode: 'screen',
            opacity: 0.03 * level * effectMultiplier,
            background: `linear-gradient(90deg,
              rgba(255,0,0,0.1) 0%,
              transparent 10%,
              transparent 90%,
              rgba(0,255,255,0.1) 100%)`,
          }}
        />
      )}

      {/* Glitch Flash */}
      <AnimatePresence>
        {glitchActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0, 0.6, 0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed inset-0 z-50"
            style={{
              background: `linear-gradient(
                ${Math.random() * 180}deg,
                transparent 0%,
                rgba(255,0,0,${0.05 + level * 0.02}) 20%,
                transparent 40%,
                rgba(0,255,255,${0.05 + level * 0.02}) 60%,
                transparent 80%,
                rgba(255,255,255,${0.02 * level}) 100%
              )`,
            }}
          />
        )}
      </AnimatePresence>

      {/* VHS Tracking Lines */}
      <AnimatePresence>
        {vhsActive && (
          <>
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: '100vh' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'linear' }}
              className="pointer-events-none fixed inset-x-0 z-50 h-4"
              style={{
                background: 'linear-gradient(transparent, rgba(255,255,255,0.15), transparent)',
              }}
            />
            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: '-100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'linear' }}
              className="pointer-events-none fixed inset-x-0 z-50 h-2"
              style={{
                background: 'linear-gradient(transparent, rgba(255,255,255,0.1), transparent)',
                top: `${Math.random() * 50 + 25}%`,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Signal Loss (Black Flash) */}
      <AnimatePresence>
        {signalLoss && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="pointer-events-none fixed inset-0 z-[60] bg-black"
          />
        )}
      </AnimatePresence>

      {/* Noise Overlay - level 2+ */}
      {level >= 2 && (
        <div
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            opacity: 0.02 + (level * 0.01),
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Horizontal Distortion Lines - level 3+ */}
      {level >= 3 && !sanityMode && (
        <div className="pointer-events-none fixed inset-0 z-45 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px w-full bg-white/10"
              initial={{ x: '-100%', top: `${20 + i * 30}%` }}
              animate={{ x: '100%' }}
              transition={{
                duration: 0.5,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: getRandomInterval(2, 5),
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
