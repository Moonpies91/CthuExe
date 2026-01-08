'use client'

import { useState, useEffect, useRef, RefObject } from 'react'

interface StickyState {
  isSticky: boolean
  top: number
}

export function useStickyScroll(topOffset: number = 24): {
  ref: RefObject<HTMLDivElement>
  isSticky: boolean
  stickyStyles: React.CSSProperties
} {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<StickyState>({ isSticky: false, top: 0 })
  const [initialTop, setInitialTop] = useState<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Get initial position on mount
    const rect = element.getBoundingClientRect()
    const scrollTop = window.scrollY
    setInitialTop(rect.top + scrollTop)
  }, [])

  useEffect(() => {
    if (initialTop === null) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const shouldBeSticky = scrollTop > initialTop - topOffset

      setState({
        isSticky: shouldBeSticky,
        top: shouldBeSticky ? topOffset : 0,
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [initialTop, topOffset])

  const stickyStyles: React.CSSProperties = state.isSticky
    ? {
        position: 'fixed',
        top: `${state.top}px`,
        width: ref.current?.offsetWidth || 320,
      }
    : {}

  return { ref, isSticky: state.isSticky, stickyStyles }
}
