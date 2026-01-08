'use client'

export function BlinkingCursor({ className = '' }: { className?: string }) {
  return (
    <span className={`animate-pulse text-green-500 ${className}`}>█</span>
  )
}
