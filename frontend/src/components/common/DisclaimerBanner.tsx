'use client'

export function DisclaimerBanner() {
  return (
    <div className="bg-red-950/95 border-b border-red-800">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-red-500 font-mono animate-pulse">
            [!]
          </span>
          <div className="text-red-300/90 font-mono text-xs">
            <strong>EXPERIMENTAL PROJECT:</strong> Only use crypto you can afford to lose entirely. Not financial advice. Smart contracts may contain bugs. DYOR.
          </div>
        </div>
      </div>
    </div>
  )
}
