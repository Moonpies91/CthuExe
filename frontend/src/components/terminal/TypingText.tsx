'use client'

import { useEffect, useState } from 'react'
import { BlinkingCursor } from './BlinkingCursor'

interface TypingTextProps {
  text: string
  speed?: number
  delay?: number
  showCursor?: boolean
  onComplete?: () => void
  className?: string
}

export function TypingText({
  text,
  speed = 30,
  delay = 0,
  showCursor = true,
  onComplete,
  className = ''
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [started, setStarted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const startTimeout = setTimeout(() => {
      setStarted(true)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [delay, mounted])

  useEffect(() => {
    if (!started || !mounted) return

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [started, text, speed, onComplete, mounted])

  if (!mounted) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && <BlinkingCursor />}
    </span>
  )
}
