'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

// Lovecraftian glyphs and symbols
const ELDRITCH_GLYPHS = [
  'Ӝ', 'Ҩ', 'Ӂ', 'Ѫ', 'Ѭ', 'Ѯ', 'Ҳ', 'Ψ', 'Ω', 'Ӟ',
  'Ӡ', 'Ӫ', 'Ҵ', 'Ӻ', 'Ͼ', 'Ͽ', 'Ϡ', 'Ϟ', 'Ϛ', 'Ϙ',
  '҉', '̈', '̈́', '͠', '͝', '̷', '̴', '̵', '̶', '̢',
  '₪', '₮', '₱', '₲', '₳', '₴', '₵', '₸', '₹', '₺',
  '⍟', '⌬', '⏃', '⏁', '⏂', '⏚', '⎔', '⎈', '⌘', '⌖',
  '☠', '☤', '☥', '☦', '☧', '☨', '☩', '☪', '☫', '☬',
  '⛤', '⛧', '⚝', '✡', '✠', '☿', '♄', '♃', '♆', '♅',
]

interface CorruptedTextProps {
  children: string
  intensity?: number // Override madness level
  className?: string
  corruptionChance?: number // Base chance to corrupt (0-1)
}

export function CorruptedText({
  children,
  intensity,
  className = '',
  corruptionChance = 0.15
}: CorruptedTextProps) {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [corruptedText, setCorruptedText] = useState(children)
  const [glitchKey, setGlitchKey] = useState(0)

  const level = intensity ?? madnessLevel

  // Calculate actual corruption chance based on level
  const actualCorruptionChance = useMemo(() => {
    if (sanityMode || level === 0) return 0
    return corruptionChance * (level / 4)
  }, [sanityMode, level, corruptionChance])

  // Corrupt the text
  useEffect(() => {
    if (actualCorruptionChance === 0) {
      setCorruptedText(children)
      return
    }

    const corruptText = () => {
      const chars = children.split('')
      const corrupted = chars.map((char) => {
        // Don't corrupt spaces or special chars
        if (char === ' ' || char === '\n' || char === '\t') return char

        // Random chance to corrupt based on level
        if (Math.random() < actualCorruptionChance) {
          return ELDRITCH_GLYPHS[Math.floor(Math.random() * ELDRITCH_GLYPHS.length)]
        }
        return char
      })
      setCorruptedText(corrupted.join(''))
    }

    corruptText()

    // Re-corrupt periodically at higher levels
    const interval = setInterval(() => {
      if (Math.random() < level * 0.1) {
        corruptText()
        setGlitchKey(k => k + 1)
      }
    }, 2000 + Math.random() * 3000)

    return () => clearInterval(interval)
  }, [children, actualCorruptionChance, level])

  // Determine text color based on level
  const textColorClass = useMemo(() => {
    if (sanityMode || level < 2) return ''
    if (level === 2) return 'corruption-level-2'
    if (level === 3) return 'corruption-level-3'
    if (level >= 4) return 'corruption-level-4'
    return ''
  }, [sanityMode, level])

  return (
    <span
      key={glitchKey}
      className={`${className} ${textColorClass}`}
      style={{
        transition: 'color 0.3s ease',
      }}
    >
      {corruptedText}
    </span>
  )
}

// Global styles for corruption levels
export function CorruptionStyles() {
  return (
    <style jsx global>{`
      .corruption-level-2 {
        color: #ff9999 !important;
      }

      .corruption-level-3 {
        color: #ff6666 !important;
        text-shadow: 0 0 5px rgba(255, 0, 0, 0.3);
      }

      .corruption-level-4 {
        color: #ff3333 !important;
        text-shadow: 0 0 8px rgba(255, 0, 0, 0.5), 0 0 15px rgba(255, 0, 0, 0.3);
        animation: redPulse 2s ease-in-out infinite;
      }

      @keyframes redPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.85; }
      }
    `}</style>
  )
}
