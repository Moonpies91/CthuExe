'use client'

import { useState, useEffect } from 'react'

export function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('disclaimer-dismissed')
    setDismissed(isDismissed === 'true')
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('disclaimer-dismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div className="bg-gray-900/95 border-b border-gray-700 relative">
      <div className="max-w-6xl mx-auto px-4 py-3 pr-12">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 font-mono mt-0.5">
            [i]
          </span>
          <div className="text-gray-300/90 font-mono text-xs space-y-2">
            {/* Info Notice */}
            <div className="font-bold text-blue-400">
              INFORMATION DISPLAY: This website displays blockchain data only.
              No transactions can be made through this interface.
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 underline hover:text-gray-400"
            >
              {expanded ? 'Show less' : 'Learn more'}
            </button>

            {expanded && (
              <div className="space-y-2 border-t border-gray-700 pt-2 mt-2">
                <div className="text-gray-500">
                  This website is an information-only display for an experimental blockchain project.
                  It reads and displays data from deployed smart contracts but does not facilitate
                  any transactions, trades, or financial activities.
                </div>

                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>No wallet connection required</li>
                  <li>No transactions possible through this site</li>
                  <li>Information displayed is read directly from the blockchain</li>
                  <li>This is a hobby project for educational purposes</li>
                </ul>

                <div className="text-gray-600 text-xs mt-2">
                  This website is operated by an individual developer as an experimental project.
                  Nothing on this website constitutes financial, legal, or investment advice.
                </div>
              </div>
            )}

            {/* Hobby project disclaimer */}
            <div className="text-gray-500 border-t border-gray-700/50 pt-2">
              <strong>EXPERIMENTAL PROJECT:</strong> This is a hobby project by a solo developer
              exploring blockchain technology. For informational purposes only.
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-300 font-mono text-sm px-2 py-1 border border-gray-700 hover:border-gray-500 transition-colors"
          aria-label="Dismiss notice"
        >
          [X]
        </button>
      </div>
    </div>
  )
}
