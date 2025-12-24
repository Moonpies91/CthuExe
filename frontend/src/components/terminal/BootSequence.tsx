'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BOOT_MESSAGES = [
  'INITIALIZING CTHU-OS v0.6.6.6...',
  'LOADING ELDRITCH PROTOCOLS...',
  'CONNECTING TO THE VOID...',
  'AWAKENING ANCIENT CONTRACTS...',
  'SYNCHRONIZING WITH MONAD BLOCKCHAIN...',
  'ESTABLISHING CULT NETWORK...',
  'SUMMONING DEX LIQUIDITY POOLS...',
  'BINDING LAUNCHPAD RITUALS...',
  'CALIBRATING BONDING CURVES...',
  '',
  "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn",
  '',
  'SYSTEM READY. WELCOME, CULTIST.',
]

interface BootSequenceProps {
  onComplete: () => void
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [currentLine, setCurrentLine] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

  const skip = useCallback(() => {
    setIsComplete(true)
    setTimeout(onComplete, 500)
  }, [onComplete])

  // Handle key press to skip
  useEffect(() => {
    const handleKeyPress = () => skip()
    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('click', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('click', handleKeyPress)
    }
  }, [skip])

  // Typing effect
  useEffect(() => {
    if (isComplete) return
    if (currentLine >= BOOT_MESSAGES.length) {
      setTimeout(() => {
        setIsComplete(true)
        onComplete()
      }, 1000)
      return
    }

    const message = BOOT_MESSAGES[currentLine]

    if (message === '') {
      // Empty line - quick pause
      setTimeout(() => setCurrentLine(prev => prev + 1), 300)
      return
    }

    let charIndex = 0
    setDisplayedText('')

    const typeInterval = setInterval(() => {
      if (charIndex < message.length) {
        setDisplayedText(message.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => setCurrentLine(prev => prev + 1), 200)
      }
    }, 30)

    return () => clearInterval(typeInterval)
  }, [currentLine, isComplete, onComplete])

  // Cursor blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(blinkInterval)
  }, [])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col justify-center items-center p-8"
        >
          <div className="max-w-2xl w-full font-mono">
            {/* Previous lines */}
            {BOOT_MESSAGES.slice(0, currentLine).map((msg, i) => (
              <div
                key={i}
                className={`mb-1 ${
                  msg.includes("Ph'nglui")
                    ? 'text-cthu-purple text-center my-4'
                    : msg.includes('WELCOME')
                      ? 'text-cthu-green font-bold'
                      : 'text-gray-400'
                }`}
              >
                {msg && (
                  <>
                    <span className="text-cthu-green mr-2">&gt;</span>
                    {msg}
                  </>
                )}
              </div>
            ))}

            {/* Current line being typed */}
            {currentLine < BOOT_MESSAGES.length && BOOT_MESSAGES[currentLine] && (
              <div className={`mb-1 ${
                BOOT_MESSAGES[currentLine].includes("Ph'nglui")
                  ? 'text-cthu-purple text-center my-4'
                  : 'text-white'
              }`}>
                <span className="text-cthu-green mr-2">&gt;</span>
                {displayedText}
                <span className={`${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
              </div>
            )}
          </div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 text-gray-500 text-sm"
          >
            Press any key to skip...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
