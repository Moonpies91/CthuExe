'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cthucoin-boot-shown'

export function useBootSequence() {
  const [showBoot, setShowBoot] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if boot sequence was already shown this session
    const bootShown = sessionStorage.getItem(STORAGE_KEY)
    setShowBoot(!bootShown)
    setIsLoaded(true)
  }, [])

  const completeBoot = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setShowBoot(false)
  }

  const resetBoot = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setShowBoot(true)
  }

  return {
    showBoot,
    completeBoot,
    resetBoot,
    isLoaded,
  }
}
