'use client'

import { useState, useEffect } from 'react'

interface TypedTextProps {
  text: string
  delay?: number // delay before starting to type
  speed?: number // ms per character
  className?: string
  onComplete?: () => void
}

export function TypedText({ text, delay = 0, speed = 30, className = '', onComplete }: TypedTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1))
      }, speed)
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [started, displayedText, text, speed, onComplete])

  if (!started) return null

  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && <span className="animate-pulse">_</span>}
    </span>
  )
}

interface TypedLinesProps {
  lines: Array<{
    text: string
    className?: string
    link?: string
  }>
  baseDelay?: number
  lineDelay?: number
  speed?: number
  onAllComplete?: () => void
}

export function TypedLines({ lines, baseDelay = 0, lineDelay = 100, speed = 20, onAllComplete }: TypedLinesProps) {
  const [completedLines, setCompletedLines] = useState(0)
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    // Show lines one at a time
    if (visibleLines < lines.length) {
      const timer = setTimeout(() => {
        setVisibleLines(v => v + 1)
      }, baseDelay + visibleLines * lineDelay)
      return () => clearTimeout(timer)
    }
  }, [visibleLines, lines.length, baseDelay, lineDelay])

  useEffect(() => {
    if (completedLines === lines.length && onAllComplete) {
      onAllComplete()
    }
  }, [completedLines, lines.length, onAllComplete])

  return (
    <>
      {lines.slice(0, visibleLines).map((line, i) => (
        <div key={i} className={line.className}>
          <TypedText
            text={line.text}
            delay={0}
            speed={speed}
            onComplete={() => setCompletedLines(c => c + 1)}
          />
        </div>
      ))}
    </>
  )
}
