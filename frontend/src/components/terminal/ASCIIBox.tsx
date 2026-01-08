'use client'

import { ReactNode } from 'react'

interface ASCIIBoxProps {
  children: ReactNode
  title?: string
  className?: string
  variant?: 'single' | 'double'
}

export function ASCIIBox({ children, title, className = '', variant = 'single' }: ASCIIBoxProps) {
  // Box drawing characters
  const chars = variant === 'double'
    ? { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', lt: '╠', rt: '╣' }
    : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', lt: '├', rt: '┤' }

  return (
    <div className={`font-mono ${className}`}>
      {/* Top border with optional title */}
      <div className="text-gray-500 whitespace-pre select-none">
        {chars.tl}{chars.h}{chars.h}
        {title && <span className="text-white"> {title} </span>}
        {chars.h.repeat(title ? 30 : 36)}{chars.tr}
      </div>

      {/* Content with side borders */}
      <div className="relative">
        <span className="absolute left-0 top-0 bottom-0 text-gray-500 select-none">{chars.v}</span>
        <div className="px-4 py-2">
          {children}
        </div>
        <span className="absolute right-0 top-0 bottom-0 text-gray-500 select-none">{chars.v}</span>
      </div>

      {/* Bottom border */}
      <div className="text-gray-500 whitespace-pre select-none">
        {chars.bl}{chars.h.repeat(38)}{chars.br}
      </div>
    </div>
  )
}

// Simpler inline box for smaller elements
export function ASCIIBoxInline({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <span className={`font-mono ${className}`}>
      [{children}]
    </span>
  )
}
