'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cthucoin-sanity-mode'

export function useSanityMode() {
  const [sanityMode, setSanityMode] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setSanityMode(stored === 'true')
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when changed
  const toggleSanityMode = () => {
    const newValue = !sanityMode
    setSanityMode(newValue)
    localStorage.setItem(STORAGE_KEY, String(newValue))
  }

  return {
    sanityMode,
    toggleSanityMode,
    isLoaded,
  }
}
