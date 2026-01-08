'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'

interface StickyPanelProps {
  children: ReactNode
  topOffset?: number
  className?: string
}

export function StickyPanel({ children, topOffset = 24, className = '' }: StickyPanelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)
  // Store the absolute top position in the document (not relative to viewport)
  const [triggerPoint, setTriggerPoint] = useState<number | null>(null)
  const [fixedRight, setFixedRight] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Calculate positions once on mount and on resize
  useEffect(() => {
    const wrapper = wrapperRef.current
    const content = contentRef.current
    if (!wrapper || !content) return

    const calculatePositions = () => {
      const wrapperRect = wrapper.getBoundingClientRect()
      const contentRect = content.getBoundingClientRect()

      // Calculate absolute position from document top
      const absoluteTop = wrapperRect.top + window.scrollY
      setTriggerPoint(absoluteTop - topOffset)

      // Calculate right position (distance from right edge of viewport)
      setFixedRight(window.innerWidth - wrapperRect.right)

      // Store dimensions
      setDimensions({
        width: contentRect.width,
        height: contentRect.height,
      })
    }

    calculatePositions()

    window.addEventListener('resize', calculatePositions)
    return () => window.removeEventListener('resize', calculatePositions)
  }, [topOffset])

  // Handle scroll separately - just check if we've passed the trigger point
  useEffect(() => {
    if (triggerPoint === null) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsSticky(scrollY > triggerPoint)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [triggerPoint])

  return (
    <div ref={wrapperRef} className={className} style={{ minWidth: dimensions.width }}>
      {/* Spacer */}
      <div style={{ height: isSticky ? dimensions.height : 0 }} />

      {/* Content */}
      <div
        ref={contentRef}
        style={isSticky && fixedRight !== null ? {
          position: 'fixed',
          top: topOffset,
          right: fixedRight,
          width: dimensions.width,
          zIndex: 40,
        } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
