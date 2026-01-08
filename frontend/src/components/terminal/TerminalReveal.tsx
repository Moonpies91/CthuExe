'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface TerminalRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

// Reveals content with a scan line effect like old CRT monitors
export function ScanlineReveal({ children, delay = 0, className = '' }: TerminalRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [scanPosition, setScanPosition] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRevealed(true)
      // Animate scan line
      let pos = 0
      const interval = setInterval(() => {
        pos += 5
        setScanPosition(pos)
        if (pos >= 100) {
          clearInterval(interval)
        }
      }, 20)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`relative ${className}`}>
      {/* Content with clip mask */}
      <div
        style={{
          clipPath: revealed ? `inset(0 0 ${100 - scanPosition}% 0)` : 'inset(0 0 100% 0)',
        }}
      >
        {children}
      </div>

      {/* Scan line */}
      {revealed && scanPosition < 100 && (
        <div
          className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
          style={{
            top: `${scanPosition}%`,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), rgba(255,255,255,0.4), transparent)',
            boxShadow: '0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.3)',
          }}
        />
      )}
    </div>
  )
}

// Flicker in effect - content flickers before stabilizing
export function FlickerReveal({ children, delay = 0, className = '' }: TerminalRevealProps) {
  const [phase, setPhase] = useState(0) // 0=hidden, 1-4=flickering, 5=visible

  useEffect(() => {
    const timer = setTimeout(() => {
      // Flicker sequence
      const flickerTimings = [0, 50, 120, 180, 280, 350]
      flickerTimings.forEach((timing, index) => {
        setTimeout(() => setPhase(index + 1), timing)
      })
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  const getOpacity = () => {
    switch (phase) {
      case 0: return 0
      case 1: return 0.7
      case 2: return 0.2
      case 3: return 0.9
      case 4: return 0.4
      case 5: return 1
      default: return 1
    }
  }

  return (
    <div
      className={className}
      style={{
        opacity: getOpacity(),
        transition: 'opacity 0.03s linear',
      }}
    >
      {children}
    </div>
  )
}

// Text types out character by character
interface TypewriterRevealProps {
  children: string
  delay?: number
  speed?: number // ms per character
  className?: string
  cursor?: boolean
}

export function TypewriterReveal({
  children,
  delay = 0,
  speed = 30,
  className = '',
  cursor = true
}: TypewriterRevealProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true)
      let index = 0
      const interval = setInterval(() => {
        if (index < children.length) {
          setDisplayedText(children.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
          setIsTyping(false)
        }
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [children, delay, speed])

  // Cursor blink
  useEffect(() => {
    if (!cursor) return
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [cursor])

  return (
    <span className={className}>
      {displayedText}
      {cursor && (isTyping || displayedText.length < children.length) && (
        <span style={{ opacity: showCursor ? 1 : 0 }}>_</span>
      )}
    </span>
  )
}

// Content appears line by line like terminal output
interface LineByLineRevealProps {
  children: React.ReactNode
  delay?: number
  lineDelay?: number // ms between each line
  className?: string
}

export function LineByLineReveal({
  children,
  delay = 0,
  lineDelay = 80,
  className = ''
}: LineByLineRevealProps) {
  const [visibleLines, setVisibleLines] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [totalLines, setTotalLines] = useState(0)

  useEffect(() => {
    // Count direct children
    if (containerRef.current) {
      setTotalLines(containerRef.current.children.length)
    }
  }, [children])

  useEffect(() => {
    if (totalLines === 0) return

    const timer = setTimeout(() => {
      let line = 0
      const interval = setInterval(() => {
        line++
        setVisibleLines(line)
        if (line >= totalLines) {
          clearInterval(interval)
        }
      }, lineDelay)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay, lineDelay, totalLines])

  return (
    <div ref={containerRef} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              style={{
                opacity: index < visibleLines ? 1 : 0,
                transform: index < visibleLines ? 'translateY(0)' : 'translateY(-2px)',
                transition: 'opacity 0.05s, transform 0.05s',
              }}
            >
              {child}
            </div>
          ))
        : <div style={{ opacity: visibleLines > 0 ? 1 : 0 }}>{children}</div>
      }
    </div>
  )
}

// Block reveal - appears in chunks/blocks like data loading
export function BlockReveal({ children, delay = 0, className = '' }: TerminalRevealProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Quick block-style appearance
      setTimeout(() => setPhase(1), 0)
      setTimeout(() => setPhase(2), 40)
      setTimeout(() => setPhase(3), 80)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={className}
      style={{
        opacity: phase === 0 ? 0 : 1,
        clipPath: phase === 0
          ? 'inset(0 100% 0 0)'
          : phase === 1
            ? 'inset(0 60% 0 0)'
            : phase === 2
              ? 'inset(0 20% 0 0)'
              : 'inset(0 0% 0 0)',
        transition: 'clip-path 0.05s linear',
      }}
    >
      {children}
    </div>
  )
}

// Glitch in effect - appears with brief glitch
export function GlitchReveal({ children, delay = 0, className = '' }: TerminalRevealProps) {
  const [phase, setPhase] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      // Glitch sequence
      setPhase(1)
      setOffset({ x: 5, y: -2 })

      setTimeout(() => {
        setOffset({ x: -3, y: 1 })
      }, 30)

      setTimeout(() => {
        setOffset({ x: 2, y: -1 })
      }, 60)

      setTimeout(() => {
        setPhase(2)
        setOffset({ x: 0, y: 0 })
      }, 100)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`relative ${className}`}
      style={{
        opacity: phase === 0 ? 0 : 1,
      }}
    >
      {/* Main content */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: 'transform 0.02s',
        }}
      >
        {children}
      </div>

      {/* Red ghost */}
      {phase === 1 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${offset.x + 2}px, ${offset.y}px)`,
            opacity: 0.5,
            filter: 'blur(1px)',
            mixBlendMode: 'screen',
          }}
        >
          <div style={{ color: 'red' }}>{children}</div>
        </div>
      )}

      {/* Cyan ghost */}
      {phase === 1 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${offset.x - 2}px, ${offset.y}px)`,
            opacity: 0.5,
            filter: 'blur(1px)',
            mixBlendMode: 'screen',
          }}
        >
          <div style={{ color: 'cyan' }}>{children}</div>
        </div>
      )}
    </div>
  )
}

// Simple instant appear with optional flicker
export function InstantReveal({ children, delay = 0, className = '', flicker = true }: TerminalRevealProps & { flicker?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [flickerOpacity, setFlickerOpacity] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
      if (flicker) {
        // Quick flicker
        setTimeout(() => setFlickerOpacity(0.6), 20)
        setTimeout(() => setFlickerOpacity(1), 50)
        setTimeout(() => setFlickerOpacity(0.8), 80)
        setTimeout(() => setFlickerOpacity(1), 110)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [delay, flicker])

  return (
    <div
      className={className}
      style={{
        opacity: visible ? flickerOpacity : 0,
      }}
    >
      {children}
    </div>
  )
}

// Stagger children with terminal-style delays
interface StaggerRevealProps {
  children: React.ReactNode
  delay?: number
  stagger?: number
  className?: string
}

export function StaggerReveal({ children, delay = 0, stagger = 100, className = '' }: StaggerRevealProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const childArray = Array.isArray(children) ? children : [children]

  useEffect(() => {
    const timer = setTimeout(() => {
      let count = 0
      const interval = setInterval(() => {
        count++
        setVisibleCount(count)
        if (count >= childArray.length) {
          clearInterval(interval)
        }
      }, stagger)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay, stagger, childArray.length])

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <FlickerReveal key={index} delay={index < visibleCount ? 0 : 999999}>
          {index < visibleCount ? child : <div style={{ visibility: 'hidden' }}>{child}</div>}
        </FlickerReveal>
      ))}
    </div>
  )
}
