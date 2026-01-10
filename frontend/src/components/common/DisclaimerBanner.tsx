'use client'

export function DisclaimerBanner() {
  return (
    <div className="bg-red-950/95 border-b border-red-800">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-start gap-3">
          <span className="text-red-500 font-mono animate-pulse mt-0.5">
            [!]
          </span>
          <div className="text-red-300/90 font-mono text-xs space-y-1">
            <div>
              <strong>EXPERIMENTAL PROJECT:</strong> This is a hobby project by a solo developer learning about blockchain and web3. Expect bugs and breaking changes.
            </div>
            <div className="text-red-400/70">
              Only use crypto you can afford to lose entirely. Not financial advice. DYOR.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
