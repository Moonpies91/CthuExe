'use client'

import { useState } from 'react'

export function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-red-950/95 border-b border-red-800">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-red-500 font-mono animate-pulse mt-0.5">
            [!]
          </span>
          <div className="text-red-300/90 font-mono text-xs space-y-2">
            {/* FCA Required Risk Warning */}
            <div className="font-bold text-red-400">
              RISK WARNING: Don&apos;t invest unless you&apos;re prepared to lose all
              the money you invest. This is a high-risk investment and you
              should not expect to be protected if something goes wrong.
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-red-500 underline hover:text-red-400"
            >
              {expanded ? 'Show less' : 'Take 2 mins to learn more'}
            </button>

            {expanded && (
              <div className="space-y-2 border-t border-red-800 pt-2 mt-2">
                <ul className="list-disc list-inside space-y-1 text-red-400/80">
                  <li>The value of cryptoassets can go down as well as up</li>
                  <li>You may lose all the money you invest</li>
                  <li>You should not invest money you cannot afford to lose</li>
                  <li>Cryptoassets are not protected by the Financial Services Compensation Scheme (FSCS)</li>
                  <li>Cryptoassets are not covered by the Financial Ombudsman Service (FOS)</li>
                </ul>

                <div className="text-yellow-500/90 border border-yellow-700/50 bg-yellow-900/20 p-2 mt-2">
                  <strong>UK RESIDENTS:</strong> This website is not intended for, and should not be
                  accessed by, residents of the United Kingdom. The promotions on this website have
                  not been approved by an FCA-authorised person.
                </div>

                <div className="text-gray-500 text-xs mt-2">
                  This website is operated by an individual developer as an experimental project.
                  It is not authorised or regulated by the Financial Conduct Authority (FCA).
                  No financial advice is provided.
                </div>
              </div>
            )}

            {/* Existing hobby project disclaimer */}
            <div className="text-red-400/70 border-t border-red-800/50 pt-2">
              <strong>EXPERIMENTAL PROJECT:</strong> This is a hobby project by a solo developer
              learning about blockchain and web3. Expect bugs and breaking changes. DYOR.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
