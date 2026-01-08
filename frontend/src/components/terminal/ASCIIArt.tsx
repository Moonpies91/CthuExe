'use client'

interface ASCIIArtProps {
  art: 'cthulhu' | 'tentacles' | 'eye' | 'divider'
  className?: string
}

const ARTS = {
  cthulhu: `
      ,     ,
     (\\____/)
      (_oo_)
        (O)
      __||__    \\)
   []/______\\[] /
   / \\______/ \\/
  /    /__\\
 (\\   /____\\
`,
  tentacles: `
  ~^~^~^~^~^~^~^~^~^~^~
 ) ) ) ) ) ) ) ) ) ) ) )
  ~^~^~^~^~^~^~^~^~^~^~
`,
  eye: `
     .---.
    /     \\
   | () () |
    \\  ^  /
     '---'
`,
  divider: `
════════════════════════════════════════════════════════════════
`,
}

export function ASCIIArt({ art, className = '' }: ASCIIArtProps) {
  return (
    <pre className={`font-mono text-xs text-gray-600 whitespace-pre select-none ${className}`}>
      {ARTS[art]}
    </pre>
  )
}

// Decorative line dividers
export function ASCIIDivider({ char = '═', length = 60, className = '' }: { char?: string, length?: number, className?: string }) {
  return (
    <div className={`font-mono text-gray-600 select-none ${className}`}>
      {char.repeat(length)}
    </div>
  )
}

// Terminal prompt prefix
export function TerminalPrompt({ className = '' }: { className?: string }) {
  return (
    <span className={`font-mono text-gray-500 ${className}`}>
      {'>'}&nbsp;
    </span>
  )
}
