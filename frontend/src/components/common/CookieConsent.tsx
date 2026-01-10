'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-gray-400 text-xs font-mono">
          We use essential cookies only to make this site work. No tracking or analytics.{' '}
          <Link href="/privacy#cookies" className="text-teal-500 underline hover:text-teal-400">
            Learn more
          </Link>
        </div>
        <div className="flex gap-3">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 border border-gray-700 text-gray-500 hover:bg-gray-900 text-xs font-mono"
          >
            Reject
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 bg-teal-900 border border-teal-700 text-teal-300 hover:bg-teal-800 text-xs font-mono"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
