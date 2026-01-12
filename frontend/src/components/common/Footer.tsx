'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-8 py-4 font-mono">
      <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-xs space-y-2">
        <div className="flex justify-center gap-4">
          <Link href="/contracts" className="hover:text-gray-400">[Sigils]</Link>
          <Link href="/roadmap" className="hover:text-gray-400">[Chronicle]</Link>
        </div>
        <div className="text-gray-700">
          ᚦᚨᛏ ᛁᛊ ᚾᛟᛏ ᛞᛖᚨᛞ ᚹᚺᛁᚲᚺ ᚲᚨᚾ ᛖᛏᛖᚱᚾᚨᛚ ᛚᛁᛖ
        </div>
      </div>
    </footer>
  )
}
