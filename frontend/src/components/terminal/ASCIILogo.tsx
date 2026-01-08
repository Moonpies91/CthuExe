'use client'

import { useEffect, useState } from 'react'

interface ASCIILogoProps {
  animate?: boolean
  size?: 'small' | 'large'
}

const LOGO_LARGE = `
 ██████╗████████╗██╗  ██╗██╗   ██╗   ███████╗██╗  ██╗███████╗
██╔════╝╚══██╔══╝██║  ██║██║   ██║   ██╔════╝╚██╗██╔╝██╔════╝
██║        ██║   ███████║██║   ██║   █████╗   ╚███╔╝ █████╗
██║        ██║   ██╔══██║██║   ██║   ██╔══╝   ██╔██╗ ██╔══╝
╚██████╗   ██║   ██║  ██║╚██████╔╝██╗███████╗██╔╝ ██╗███████╗
 ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝
`

const LOGO_SMALL = `
 ▄████▄  ▄▄▄█████▓ ██░ ██  █    ██    ▓█████ ▒██   ██▒▓█████
▒██▀ ▀█  ▓  ██▒ ▓▒▓██░ ██▒ ██  ▓██▒   ▓█   ▀ ▒▒ █ █ ▒░▓█   ▀
▒▓█    ▄ ▒ ▓██░ ▒░▒██▀▀██░▓██  ▒██░   ▒███   ░░  █   ░▒███
▒▓▓▄ ▄██▒░ ▓██▓ ░ ░▓█ ░██ ▓▓█  ░██░   ▒▓█  ▄  ░ █ █ ▒ ▒▓█  ▄
▒ ▓███▀ ░  ▒██▒ ░ ░▓█▒░██▓▒▒█████▓  ██▒░▒████▒▒██▒ ▒██▒░▒████▒
░ ░▒ ▒  ░  ▒ ░░    ▒ ░░▒░▒░▒▓▒ ▒ ▒  ▓█▒░░ ▒░ ░▒▒ ░ ░▓ ░░░ ▒░ ░
`

export function ASCIILogo({ animate = true, size = 'large' }: ASCIILogoProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const logo = size === 'large' ? LOGO_LARGE : LOGO_SMALL
  const lines = logo.trim().split('\n')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!animate) {
      setDisplayedLines(lines)
      return
    }

    let currentLine = 0
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setDisplayedLines(prev => [...prev, lines[currentLine]])
        currentLine++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [mounted, animate])

  if (!mounted) {
    return <div className="h-32" /> // Placeholder height
  }

  return (
    <pre className="font-mono text-[8px] sm:text-[10px] md:text-xs leading-none text-white whitespace-pre select-none">
      {displayedLines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          {line}
        </div>
      ))}
    </pre>
  )
}
