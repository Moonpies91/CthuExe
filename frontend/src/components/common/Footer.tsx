'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-8 py-4 font-mono">
      <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-xs space-y-2">
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-400">[Terms]</Link>
          <Link href="/privacy" className="hover:text-gray-400">[Privacy]</Link>
          <Link href="/roadmap" className="hover:text-gray-400">[Roadmap]</Link>
        </div>
        <div className="text-gray-700">
          This website is not authorised or regulated by the Financial Conduct Authority.
        </div>
        <div className="text-gray-700">
          Cryptoassets are not protected by the FSCS or covered by the FOS.
        </div>
      </div>
    </footer>
  )
}
