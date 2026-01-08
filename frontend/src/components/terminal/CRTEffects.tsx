'use client'

import { useEffect, useState } from 'react'

interface CRTEffectsProps {
  enabled?: boolean
  aberrationIntensity?: number // 1-10
  scanlineOpacity?: number // 0-1
}

export function CRTEffects({
  enabled = true,
  aberrationIntensity = 4,
  scanlineOpacity = 0.35,
}: CRTEffectsProps) {
  const [flicker, setFlicker] = useState(1)
  const [scanlineOffset, setScanlineOffset] = useState(0)
  const [interferenceTop, setInterferenceTop] = useState(0)
  const [interferenceVisible, setInterferenceVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Only render dynamic effects after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Subtle flicker - less intense
  useEffect(() => {
    if (!enabled) return

    const flickerInterval = setInterval(() => {
      // Subtle brightness variation - barely noticeable
      setFlicker(0.98 + Math.random() * 0.04)
    }, 150)

    return () => clearInterval(flickerInterval)
  }, [enabled])

  // Animate scanlines moving down slowly
  useEffect(() => {
    if (!enabled) return

    const scanlineInterval = setInterval(() => {
      setScanlineOffset(prev => (prev + 0.5) % 4)
    }, 50)

    return () => clearInterval(scanlineInterval)
  }, [enabled])

  // Interference line animation
  useEffect(() => {
    if (!enabled) return

    const interferenceInterval = setInterval(() => {
      setInterferenceTop((Date.now() / 30) % 100)
      setInterferenceVisible(Math.random() > 0.7)
    }, 100)

    return () => clearInterval(interferenceInterval)
  }, [enabled])

  if (!enabled) return null

  const aberrationOffset = aberrationIntensity * 1.5

  return (
    <>
      {/* Strong Chromatic Aberration - RGB color fringing across entire screen */}
      <div
        className="pointer-events-none fixed inset-0 z-[90]"
        style={{
          background: `
            linear-gradient(90deg,
              rgba(255, 0, 0, 0.08) 0%,
              rgba(255, 0, 0, 0.03) 5%,
              transparent 15%,
              transparent 85%,
              rgba(0, 255, 255, 0.03) 95%,
              rgba(0, 255, 255, 0.08) 100%
            )
          `,
        }}
      />

      {/* Left edge strong red fringe */}
      <div
        className="pointer-events-none fixed top-0 bottom-0 left-0 z-[91]"
        style={{
          width: `${aberrationOffset * 3}px`,
          background: `linear-gradient(90deg, rgba(255, 0, 0, 0.4), rgba(255, 0, 0, 0.1), transparent)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Right edge strong cyan fringe */}
      <div
        className="pointer-events-none fixed top-0 bottom-0 right-0 z-[91]"
        style={{
          width: `${aberrationOffset * 3}px`,
          background: `linear-gradient(270deg, rgba(0, 255, 255, 0.4), rgba(0, 255, 255, 0.1), transparent)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Top edge subtle magenta */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-[91]"
        style={{
          height: `${aberrationOffset * 2}px`,
          background: `linear-gradient(180deg, rgba(255, 0, 255, 0.15), transparent)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Bottom edge subtle green */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[91]"
        style={{
          height: `${aberrationOffset * 2}px`,
          background: `linear-gradient(0deg, rgba(0, 255, 0, 0.1), transparent)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Heavy Horizontal Underscan Lines - very visible */}
      <div
        className="pointer-events-none fixed inset-0 z-[95]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0) 0px,
            rgba(0, 0, 0, 0) 1px,
            rgba(0, 0, 0, ${scanlineOpacity}) 1px,
            rgba(0, 0, 0, ${scanlineOpacity}) 2px
          )`,
          backgroundPosition: `0 ${scanlineOffset}px`,
          backgroundSize: '100% 2px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Secondary larger scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-[94]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            rgba(0, 0, 0, ${scanlineOpacity * 0.5}) 3px,
            rgba(0, 0, 0, ${scanlineOpacity * 0.5}) 4px
          )`,
        }}
      />

      {/* Bright scanline highlight - simulates the bright line between dark ones */}
      <div
        className="pointer-events-none fixed inset-0 z-[93]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 4px
          )`,
        }}
      />

      {/* RGB Phosphor Grid - more visible */}
      <div
        className="pointer-events-none fixed inset-0 z-[92]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              rgba(255, 0, 0, 0.06) 0px,
              rgba(255, 0, 0, 0.06) 1px,
              rgba(0, 255, 0, 0.06) 1px,
              rgba(0, 255, 0, 0.06) 2px,
              rgba(0, 0, 255, 0.06) 2px,
              rgba(0, 0, 255, 0.06) 3px
            )
          `,
          backgroundSize: '3px 100%',
        }}
      />

      {/* CRT Screen curvature - lighter vignette for brighter content */}
      <div
        className="pointer-events-none fixed inset-0 z-[88]"
        style={{
          background: `radial-gradient(
            ellipse 80% 80% at 50% 50%,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.15) 75%,
            rgba(0, 0, 0, 0.4) 100%
          )`,
        }}
      />

      {/* Corner shadow - lighter edges */}
      <div
        className="pointer-events-none fixed inset-0 z-[87]"
        style={{
          boxShadow: 'inset 0 0 150px 50px rgba(0, 0, 0, 0.25)',
        }}
      />

      {/* Screen edge glow - slight color on very edge */}
      <div
        className="pointer-events-none fixed inset-0 z-[86]"
        style={{
          boxShadow: `
            inset 3px 0 10px rgba(255, 0, 0, 0.1),
            inset -3px 0 10px rgba(0, 255, 255, 0.1),
            inset 0 3px 10px rgba(255, 0, 255, 0.05),
            inset 0 -3px 10px rgba(0, 255, 0, 0.05)
          `,
        }}
      />

      {/* Subtle flicker overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[85]"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${(1 - flicker) * 0.1})`,
          transition: 'background-color 0.1s',
        }}
      />

      {/* Occasional horizontal interference line - only render after mount */}
      {mounted && (
        <div
          className="pointer-events-none fixed left-0 right-0 z-[96]"
          style={{
            top: `${interferenceTop}%`,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            opacity: interferenceVisible ? 1 : 0,
          }}
        />
      )}

      {/* Global styles for phosphor glow */}
      <style jsx global>{`
        .crt-effect {
          text-shadow:
            0 0 2px rgba(255, 255, 255, 0.5),
            0 0 5px rgba(255, 255, 255, 0.2);
        }

        .crt-effect h1,
        .crt-effect h2,
        .crt-effect .text-white,
        .crt-effect .font-bold {
          text-shadow:
            0 0 2px rgba(255, 255, 255, 0.8),
            0 0 8px rgba(255, 255, 255, 0.4),
            0 0 15px rgba(255, 255, 255, 0.1);
        }

        /* Chromatic aberration on text */
        .crt-effect h1 {
          text-shadow:
            -2px 0 rgba(255, 0, 0, 0.3),
            2px 0 rgba(0, 255, 255, 0.3),
            0 0 10px rgba(255, 255, 255, 0.5);
        }

        /* Slight barrel distortion simulation */
        .crt-effect main {
          transform: perspective(800px) rotateX(1deg);
          transform-origin: center center;
        }

        /* Make borders glow slightly */
        .crt-effect .terminal-card,
        .crt-effect .terminal-button {
          box-shadow:
            0 0 1px rgba(255, 255, 255, 0.3),
            inset 0 0 1px rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </>
  )
}
