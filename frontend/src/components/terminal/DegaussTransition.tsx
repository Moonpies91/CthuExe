'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface DegaussTransitionProps {
  children: React.ReactNode
}

export function DegaussTransition({ children }: DegaussTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const [degaussPhase, setDegaussPhase] = useState(0)
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Detect route changes
  useEffect(() => {
    if (pathname !== prevPathname) {
      // Start degauss effect
      setIsTransitioning(true)
      setShowContent(false)
      setDegaussPhase(1)

      // Phase 2: Maximum distortion
      setTimeout(() => setDegaussPhase(2), 80)

      // Phase 3: Settling
      setTimeout(() => setDegaussPhase(3), 200)

      // Phase 4: Almost done
      setTimeout(() => setDegaussPhase(4), 350)

      // Show new content
      setTimeout(() => {
        setShowContent(true)
        setDegaussPhase(5)
      }, 450)

      // End transition
      setTimeout(() => {
        setIsTransitioning(false)
        setDegaussPhase(0)
        setPrevPathname(pathname)
      }, 650)
    }
  }, [pathname, prevPathname])

  return (
    <>
      {/* Degauss Effect Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <>
            {/* Screen wobble/wave distortion - subtle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="fixed inset-0 z-[100] pointer-events-none"
              style={{
                background: degaussPhase >= 2 && degaussPhase <= 3
                  ? `radial-gradient(ellipse at ${50 + Math.sin(degaussPhase * 2) * 15}% 50%,
                      rgba(200, 100, 200, 0.12),
                      rgba(100, 200, 200, 0.08) 30%,
                      rgba(200, 100, 100, 0.06) 60%,
                      transparent 80%)`
                  : 'transparent',
              }}
            />

            {/* Horizontal wave lines - subtle */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`wave-${i}`}
                className="fixed left-0 right-0 z-[101] pointer-events-none"
                style={{
                  top: `${(i * 12.5)}%`,
                  height: '2px',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{
                  scaleX: degaussPhase >= 1 && degaussPhase <= 4 ? [0, 1.2, 0.9, 1] : 0,
                  opacity: degaussPhase >= 1 && degaussPhase <= 4 ? [0, 0.4, 0.3, 0.2, 0] : 0,
                  x: degaussPhase >= 2 ? [0, 10, -8, 5, 0] : 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.015,
                  ease: 'easeOut',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg,
                      transparent,
                      rgba(${100 + i * 12}, ${200 - i * 15}, ${180 - i * 10}, 0.3) 20%,
                      rgba(200, 180, 200, 0.4) 50%,
                      rgba(${200 - i * 10}, ${100 + i * 12}, ${160 + i * 5}, 0.3) 80%,
                      transparent)`,
                  }}
                />
              </motion.div>
            ))}

            {/* Magnetic color distortion bands - subtle */}
            <motion.div
              className="fixed inset-0 z-[102] pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: degaussPhase >= 1 && degaussPhase <= 4 ? 0.6 : 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Vertical color bands that wobble */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`band-${i}`}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${i * 16.66}%`,
                    width: '16.66%',
                  }}
                  animate={{
                    x: degaussPhase >= 2 ? [0, 8, -6, 4, -2, 0] : 0,
                    skewX: degaussPhase >= 2 ? [0, 2, -1.5, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.35,
                    delay: i * 0.02,
                    ease: 'easeOut',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(180deg,
                        rgba(${(i * 30) % 255}, ${(i * 50 + 100) % 255}, ${(i * 40 + 150) % 255}, ${0.08 - i * 0.005}),
                        rgba(${(i * 40 + 50) % 255}, ${(i * 20) % 255}, ${(i * 60 + 100) % 255}, ${0.05 - i * 0.003}))`,
                      mixBlendMode: 'screen',
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Subtle center glow instead of bright flash */}
            <motion.div
              className="fixed inset-0 z-[103] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: degaussPhase === 2 ? [0, 0.25, 0.1, 0] : 0,
              }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'radial-gradient(circle at center, rgba(150,100,150,0.4) 0%, rgba(100,80,120,0.2) 40%, transparent 70%)',
              }}
            />

            {/* Screen edge color bleeding - subtle */}
            <motion.div
              className="fixed inset-0 z-[100] pointer-events-none"
              animate={{
                boxShadow: degaussPhase >= 1 && degaussPhase <= 4
                  ? [
                      'inset 0 0 60px rgba(255,0,255,0)',
                      'inset 0 0 80px rgba(255,0,255,0.15), inset 0 0 60px rgba(0,255,255,0.12)',
                      'inset 0 0 70px rgba(255,0,0,0.12), inset 0 0 50px rgba(0,255,0,0.08)',
                      'inset 0 0 50px rgba(255,255,0,0.08)',
                      'inset 0 0 30px rgba(255,0,255,0.05)',
                      'inset 0 0 0px rgba(255,0,255,0)',
                    ]
                  : 'inset 0 0 0px rgba(255,0,255,0)',
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Chromatic aberration - subtle */}
            <motion.div
              className="fixed inset-0 z-[104] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: degaussPhase === 2 || degaussPhase === 3 ? 0.5 : 0,
              }}
              transition={{ duration: 0.1 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,0,0,0.15) 0%, transparent 8%, transparent 92%, rgba(0,255,255,0.15) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(0deg, rgba(0,255,0,0.1) 0%, transparent 8%, transparent 92%, rgba(255,0,255,0.1) 100%)',
                }}
              />
            </motion.div>

            {/* Scanline burst - subtle */}
            <motion.div
              className="fixed inset-0 z-[105] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: degaussPhase >= 2 && degaussPhase <= 4 ? [0, 0.2, 0.1, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 3px,
                  rgba(0, 0, 0, 0.15) 3px,
                  rgba(0, 0, 0, 0.15) 4px
                )`,
              }}
            />

            {/* Electromagnetic interference pattern - subtle */}
            <motion.div
              className="fixed inset-0 z-[106] pointer-events-none"
              animate={{
                opacity: degaussPhase >= 1 && degaussPhase <= 3 ? [0, 0.3, 0.2, 0.1, 0] : 0,
                scale: degaussPhase >= 2 ? [1, 1.01, 0.995, 1.005, 1] : 1,
              }}
              transition={{ duration: 0.4 }}
              style={{
                background: `
                  radial-gradient(ellipse 120% 80% at 50% 50%, transparent 40%, rgba(100,0,100,0.1) 60%, transparent 80%),
                  radial-gradient(ellipse 80% 120% at 50% 50%, transparent 40%, rgba(0,100,100,0.08) 60%, transparent 80%)
                `,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Page content with degauss distortion - subtle */}
      <motion.div
        animate={{
          filter: isTransitioning
            ? degaussPhase <= 2
              ? 'blur(2px) saturate(1.3) hue-rotate(8deg)'
              : degaussPhase <= 3
                ? 'blur(1px) saturate(1.15) hue-rotate(4deg)'
                : degaussPhase <= 4
                  ? 'blur(0.5px) saturate(1.05) hue-rotate(2deg)'
                  : 'blur(0px) saturate(1) hue-rotate(0deg)'
            : 'blur(0px) saturate(1) hue-rotate(0deg)',
          scale: isTransitioning
            ? degaussPhase <= 2
              ? 1.008
              : degaussPhase <= 3
                ? 1.004
                : 1
            : 1,
          x: isTransitioning && degaussPhase >= 2 && degaussPhase <= 3
            ? [0, 2, -1.5, 0.5, 0]
            : 0,
        }}
        transition={{ duration: 0.15 }}
        style={{
          transformOrigin: 'center center',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={showContent ? pathname : 'transitioning'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Global styles for degauss effect */}
      <style jsx global>{`
        ${isTransitioning ? `
          body {
            overflow: hidden;
          }

          @keyframes degaussWobble {
            0%, 100% { transform: translateX(0) skewX(0deg); }
            20% { transform: translateX(5px) skewX(1deg); }
            40% { transform: translateX(-3px) skewX(-0.5deg); }
            60% { transform: translateX(2px) skewX(0.3deg); }
            80% { transform: translateX(-1px) skewX(-0.1deg); }
          }
        ` : ''}
      `}</style>
    </>
  )
}
