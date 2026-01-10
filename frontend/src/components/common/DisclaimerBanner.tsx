'use client'

import { useState, useEffect } from 'react'

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash

  useEffect(() => {
    // Check if user has dismissed the banner this session
    const isDismissed = sessionStorage.getItem('disclaimer-dismissed')
    setDismissed(isDismissed === 'true')
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('disclaimer-dismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-950/95 border-b border-red-800 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 font-mono text-lg animate-pulse">
              [!]
            </span>
            <div className="text-sm">
              <div className="text-red-400 font-mono font-bold mb-1">
                RISK WARNING
              </div>
              <div className="text-red-300/80 font-mono text-xs leading-relaxed">
                <p className="mb-2">
                  <strong>This is experimental software.</strong> Only use funds you can afford to lose entirely. You are unlikely to be protected if something goes wrong.
                </p>
                <p>
                  This is a hobby project by a solo developer exploring blockchain technology. It is unregulated, not financial advice, and smart contracts may contain bugs. Do your own research.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-red-500 hover:text-red-300 font-mono text-sm px-2 py-1 border border-red-800 hover:border-red-600 transition-colors shrink-0"
          >
            [X]
          </button>
        </div>
      </div>
    </div>
  )
}
