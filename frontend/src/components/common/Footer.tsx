'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-8 py-4 font-mono">
      <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-xs space-y-2">
        <div className="flex justify-center gap-4">
          <Link href="/contracts" className="hover:text-gray-400">[Contracts]</Link>
          <Link href="/terms" className="hover:text-gray-400">[Terms]</Link>
          <Link href="/privacy" className="hover:text-gray-400">[Privacy]</Link>
          <Link href="/roadmap" className="hover:text-gray-400">[Project Info]</Link>
        </div>
        <div className="text-gray-700">
          Information display only. No transactions available through this interface.
        </div>
        <div className="text-gray-700">
          Experimental hobby project. Not financial advice.
        </div>
      </div>
    </footer>
  )
}
