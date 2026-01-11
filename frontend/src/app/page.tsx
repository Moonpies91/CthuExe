'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BootSequence } from '@/components/terminal/BootSequence'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { TerminalLog } from '@/components/terminal/TerminalLog'
import { useBootSequence } from '@/hooks/useBootSequence'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS, BURN_ADDRESS } from '@/config/contracts'

// Eldritch glitch characters and runes
const GLITCH_CHARS = '▓░▒█▀▄╔╗╚╝║═╬▲▼◄►◊○●□■△▽'
const ELDRITCH_RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛟᛞ'
const ZALGO_CHARS = '̈́̈́̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̽̾̿̀́͂̓̈́'
const CORRUPT_SYMBOLS = '₪₫€₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿⌀⌁⌂⌃⌄⌅⌆⌇'

// Corrupt text with eldritch glitches
function corruptText(text: string, intensity: number = 0.1): string {
  if (intensity <= 0) return text
  return text.split('').map(char => {
    if (Math.random() < intensity) {
      const glitchType = Math.random()
      if (glitchType < 0.3) return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      if (glitchType < 0.6) return ELDRITCH_RUNES[Math.floor(Math.random() * ELDRITCH_RUNES.length)]
      if (glitchType < 0.8) return CORRUPT_SYMBOLS[Math.floor(Math.random() * CORRUPT_SYMBOLS.length)]
      return char + ZALGO_CHARS[Math.floor(Math.random() * ZALGO_CHARS.length)]
    }
    return char
  }).join('')
}

// Eldritch loading glitch overlay
function EldritchGlitchOverlay({ active, intensity = 1 }: { active: boolean, intensity?: number }) {
  const [glitchBlocks, setGlitchBlocks] = useState<Array<{
    x: number, y: number, width: number, height: number, type: 'corrupt' | 'shift' | 'rune'
  }>>([])
  const [glitchLines, setGlitchLines] = useState<Array<{ top: number, width: number, left: number, offset: number }>>([])
  const [floatingRunes, setFloatingRunes] = useState<Array<{ x: number, y: number, char: string, opacity: number }>>([])

  useEffect(() => {
    if (!active) return

    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.15 * intensity) {
        const newBlocks = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          width: Math.random() * 15 + 5,
          height: Math.random() * 8 + 2,
          type: (['corrupt', 'shift', 'rune'] as const)[Math.floor(Math.random() * 3)]
        }))
        setGlitchBlocks(newBlocks)
        setTimeout(() => setGlitchBlocks([]), 60 + Math.random() * 100)
      }

      if (Math.random() < 0.12 * intensity) {
        const newLines = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
          top: Math.random() * 100,
          width: Math.random() * 30 + 10,
          left: Math.random() * 70,
          offset: (Math.random() - 0.5) * 10,
        }))
        setGlitchLines(newLines)
        setTimeout(() => setGlitchLines([]), 50 + Math.random() * 80)
      }

      if (Math.random() < 0.1 * intensity) {
        const newRunes = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
          x: Math.random() * 90 + 5,
          y: Math.random() * 90 + 5,
          char: ELDRITCH_RUNES[Math.floor(Math.random() * ELDRITCH_RUNES.length)],
          opacity: 0.3 + Math.random() * 0.4
        }))
        setFloatingRunes(newRunes)
        setTimeout(() => setFloatingRunes([]), 100 + Math.random() * 150)
      }
    }, 120)

    return () => clearInterval(glitchInterval)
  }, [active, intensity])

  if (!active) return null

  return (
    <>
      {glitchBlocks.map((block, i) => (
        <div
          key={`block-${i}`}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${block.x}%`,
            top: `${block.y}%`,
            width: `${block.width}%`,
            height: `${block.height}px`,
            background: block.type === 'corrupt'
              ? 'linear-gradient(90deg, rgba(255,0,0,0.3), rgba(0,255,255,0.3))'
              : block.type === 'shift'
              ? 'rgba(0,255,0,0.15)'
              : 'transparent',
            transform: `translateX(${(Math.random() - 0.5) * 8}px)`,
            mixBlendMode: 'screen',
          }}
        />
      ))}

      {glitchLines.map((line, i) => (
        <div
          key={`line-${i}`}
          className="fixed bg-white/30 pointer-events-none z-50"
          style={{
            top: `${line.top}%`,
            left: `${line.left}%`,
            width: `${line.width}%`,
            height: '2px',
            transform: `translateX(${line.offset}px)`,
            boxShadow: '-2px 0 4px rgba(255,0,0,0.5), 2px 0 4px rgba(0,255,255,0.5)',
          }}
        />
      ))}

      {floatingRunes.map((rune, i) => (
        <div
          key={`rune-${i}`}
          className="fixed pointer-events-none z-40 font-mono text-green-500"
          style={{
            left: `${rune.x}%`,
            top: `${rune.y}%`,
            opacity: rune.opacity,
            fontSize: '14px',
            textShadow: '0 0 10px rgba(0,255,0,0.8), -2px 0 red, 2px 0 cyan',
            transform: `rotate(${Math.random() * 30 - 15}deg)`,
          }}
        >
          {rune.char}
        </div>
      ))}

      <div
        className="fixed inset-0 pointer-events-none z-30 opacity-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.02) 2px, rgba(0,255,0,0.02) 4px)',
        }}
      />
    </>
  )
}

// ABIs for reading contract data
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

const PAIR_ABI = [
  { name: 'getReserves', type: 'function', inputs: [], outputs: [{ name: 'reserve0', type: 'uint112' }, { name: 'reserve1', type: 'uint112' }, { name: 'blockTimestampLast', type: 'uint32' }], stateMutability: 'view' },
  { name: 'token0', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
] as const

// Cthulhu ASCII Art
const CTHULHU_ASCII = `                                ===~=:
                              [}}})*****+++~
                           }}}[>**************+
                         [}}[<***><>**++++++*++>*
                       *}}[)*^<<)}}}<<<<<<<>*~ =+:
                      }}}>*+([}}^           >]<. .
                    *[}^++)}}                  +)
                    ^}}*+[}(    ::--~^]]](=..    ~
                    ^]==+[       }}}}}}}}}}]=
                   }])=(}=    -([]{#%%%#{]^+*:
                   [*=^[<    -+[}*)]{#{[)^^<}]*
                   ^+^}    >}#%%#{}<>*=<}{##{{})=   ..
          ^        =][}          }}[   (}}            .         -
        ~>         =[~                                :          +:
       <            ]-   .          #{}               :            +
     *              *    [        =[   ]=        }    :             :+
                   )   *}#{}     }<~    ::     [{{*   :               ::.
                  *)    ={##}]<==[        :::*}{{}.   --
                  *)             [. .=>  :
                         ]^:   +(~)}}}}}}}*=[:
                 :       ]})   }} >#}* ]}}  (:
                 :       #{[  +{} >#}. ]{#  (<
                       =}{    ({} >#(  ({#  ((-
                      >}{     ##[ (#-  )}{. ]})
              .       }=    -}#>  }#-   >[*:.+(
                    ^]~     }{}  [}}    :[[*  })+
                   (}<     [#>   }}[     [}>  }}(
                   [=.    .#}:   }}(     [}=  }}(
         :         (=    ]{{     }~       >=   <[}
     ~=~-.          .    ]}}     #*       )^    .}
    +])=-:               ]{{     [=      ]]=     }
  >=~~=>~~-              :)]     ~)]     ]-      #~
([}]<=  :~~   .           ^[       }*    ]-      }:
...+>)*   ~~~~~:           [)      -}.   ]-      }.
     -===:  ~~~~~~~:        ):      }*   ]-     .}
        :=~   -~~~~~~.      *^      }*   ]
                ~~~~~~--.   *^      +:   .
                 .-~~       }]      }*
                   :-       ==      ].                )
                    .      ^       =                .
                                   [
                                   ^
                         **~
                         ^>*
                         *>*`

// Chromatic Aberration ASCII Component
function ChromaticCthulhu({ className = '' }: { className?: string }) {
  const [offset, setOffset] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 })
  const [isGlitching, setIsGlitching] = useState(false)
  const [corruptedAscii, setCorruptedAscii] = useState('')
  const totalChars = CTHULHU_ASCII.length
  const isComplete = visibleChars >= totalChars

  useEffect(() => {
    if (visibleChars < totalChars) {
      const timer = setTimeout(() => {
        setVisibleChars(prev => Math.min(prev + 4, totalChars))
      }, 3)
      return () => clearTimeout(timer)
    }
  }, [visibleChars, totalChars])

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(Math.sin(Date.now() / 1000) * 0.5)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isComplete) return
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.2) {
        setIsGlitching(true)
        setGlitchOffset({
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 4
        })
        setCorruptedAscii(corruptText(CTHULHU_ASCII.slice(0, visibleChars), 0.05))
        setTimeout(() => {
          setIsGlitching(false)
          setGlitchOffset({ x: 0, y: 0 })
        }, 50 + Math.random() * 80)
      }
    }, 100)
    return () => clearInterval(glitchInterval)
  }, [visibleChars, isComplete])

  const visibleAscii = isGlitching ? corruptedAscii : CTHULHU_ASCII.slice(0, visibleChars)
  const chromaMultiplier = isGlitching ? 2.5 : 1

  return (
    <div
      className={`relative font-mono text-[5px] sm:text-[6px] leading-[1.1] select-none ${className}`}
      style={{ transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)` }}
    >
      <pre
        className="absolute text-red-500/70 whitespace-pre"
        style={{
          transform: `translate(${(-3 + offset) * chromaMultiplier}px, ${(-2 - offset) * chromaMultiplier}px)`,
          filter: `blur(${isGlitching ? 0.8 : 0.4}px)`,
        }}
      >
        {visibleAscii}
      </pre>
      <pre
        className="absolute text-fuchsia-500/30 whitespace-pre"
        style={{
          transform: `translate(${(-5 + offset) * chromaMultiplier}px, ${-3 * chromaMultiplier}px)`,
          filter: 'blur(0.8px)',
        }}
      >
        {visibleAscii}
      </pre>
      <pre className="absolute text-green-400/80 whitespace-pre">
        {visibleAscii}
      </pre>
      <pre
        className="absolute text-cyan-400/70 whitespace-pre"
        style={{
          transform: `translate(${(3 - offset) * chromaMultiplier}px, ${(2 + offset) * chromaMultiplier}px)`,
          filter: `blur(${isGlitching ? 0.8 : 0.4}px)`,
        }}
      >
        {visibleAscii}
      </pre>
      <pre
        className="absolute text-blue-500/30 whitespace-pre"
        style={{
          transform: `translate(${(5 - offset) * chromaMultiplier}px, ${3 * chromaMultiplier}px)`,
          filter: 'blur(0.8px)',
        }}
      >
        {visibleAscii}
      </pre>
      <pre className="relative text-white/20 whitespace-pre">
        {visibleAscii}
        {!isComplete && <span className="text-green-500 animate-pulse">█</span>}
      </pre>
    </div>
  )
}

// Typing animation component
function TypeLine({
  children,
  delay = 0,
  className = '',
  speed = 20,
  showCursor = true,
  glitchIntensity = 0.08,
  onComplete
}: {
  children: string
  delay?: number
  className?: string
  speed?: number
  showCursor?: boolean
  glitchIntensity?: number
  onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)
  const [complete, setComplete] = useState(false)
  const [glitchedText, setGlitchedText] = useState('')
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length < children.length) {
      const timer = setTimeout(() => {
        setDisplayed(children.slice(0, displayed.length + 1))
      }, speed)
      return () => clearTimeout(timer)
    } else if (!complete) {
      setComplete(true)
      onComplete?.()
    }
  }, [started, displayed, children, speed, complete, onComplete])

  useEffect(() => {
    if (complete || !started) return
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setIsGlitching(true)
        setGlitchedText(corruptText(displayed, glitchIntensity))
        setTimeout(() => setIsGlitching(false), 50 + Math.random() * 100)
      }
    }, 80)
    return () => clearInterval(glitchInterval)
  }, [displayed, complete, started, glitchIntensity])

  if (!started) return <div className={className} style={{ minHeight: '1.2em' }}>&nbsp;</div>
  return (
    <div className={className}>
      <span style={isGlitching ? {
        textShadow: '-2px 0 red, 2px 0 cyan',
        filter: 'blur(0.3px)'
      } : undefined}>
        {isGlitching ? glitchedText : displayed}
      </span>
      {showCursor && !complete && <span className="animate-pulse text-green-500">█</span>}
    </div>
  )
}

// ASCII Logo Component
const RUNE_SETS = [
  'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛟᛞ',
  'ΨΩΦΘΞΣΠΛΔᾨᾯᾦᾥᾤᾣᾢᾡ',
  '⌇⌆⌅⌄⌃⌂⌁⌀⍟⍝⍜⍛⍚⍙⍘⍗',
  '☠☢☣⚰⚱⛧⛤⛥⛦⛉⛊',
  '𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍',
]

function generateRuneLogo(lines: string[]): string[] {
  const runeSet = RUNE_SETS[Math.floor(Math.random() * RUNE_SETS.length)]
  return lines.map(line =>
    line.split('').map(char => {
      if (char === ' ') return ' '
      return runeSet[Math.floor(Math.random() * runeSet.length)]
    }).join('')
  )
}

type GlitchEffect = 'none' | 'corrupt' | 'runes' | 'tear' | 'invert' | 'chromatic' | 'static' | 'shift' | 'flicker'

function TerminalAsciiLogo({ delay = 0 }: { delay?: number }) {
  const lines = [
    ' ░▒▓██████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░',
    '░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░',
    '░▒▓█▓▒░        ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░',
    '░▒▓█▓▒░        ░▒▓█▓▒░   ░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓██████▓▒░  ░▒▓██████▓▒░░▒▓██████▓▒░',
    '░▒▓█▓▒░        ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░',
    '░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓██▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░',
    ' ░▒▓██████▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓██▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░',
  ]

  const [visibleLines, setVisibleLines] = useState(0)
  const [started, setStarted] = useState(false)
  const [glitchEffect, setGlitchEffect] = useState<GlitchEffect>('none')
  const [glitchLines, setGlitchLines] = useState<number[]>([])
  const [glitchedContent, setGlitchedContent] = useState<string[]>([])
  const [runeLines, setRuneLines] = useState<string[]>([])
  const [lineOffsets, setLineOffsets] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [chromaticOffset, setChromaticOffset] = useState({ r: 0, g: 0, b: 0 })
  const [flickerOpacity, setFlickerOpacity] = useState(1)
  const [staticNoise, setStaticNoise] = useState<string[]>([])
  const isComplete = visibleLines >= lines.length

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (visibleLines < lines.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1)
      }, 70)
      return () => clearTimeout(timer)
    }
  }, [started, visibleLines, lines.length])

  useEffect(() => {
    if (!isComplete) return

    const glitchInterval = setInterval(() => {
      const rand = Math.random()

      if (rand < 0.15) {
        const effects: GlitchEffect[] = ['corrupt', 'runes', 'tear', 'invert', 'chromatic', 'static', 'shift', 'flicker']
        const effect = effects[Math.floor(Math.random() * effects.length)]
        setGlitchEffect(effect)

        switch (effect) {
          case 'runes':
            setRuneLines(generateRuneLogo(lines))
            setTimeout(() => {
              setGlitchEffect('none')
              setRuneLines([])
            }, 150 + Math.random() * 300)
            break

          case 'corrupt':
            const numLines = Math.floor(Math.random() * 4) + 1
            const targetLines = Array.from({ length: numLines }, () =>
              Math.floor(Math.random() * lines.length)
            )
            setGlitchLines(targetLines)
            setGlitchedContent(targetLines.map(i => corruptText(lines[i], 0.3 + Math.random() * 0.4)))
            setTimeout(() => {
              setGlitchEffect('none')
              setGlitchLines([])
            }, 80 + Math.random() * 120)
            break

          case 'tear':
            setLineOffsets(lines.map(() => (Math.random() - 0.5) * 30))
            setTimeout(() => {
              setGlitchEffect('none')
              setLineOffsets([0, 0, 0, 0, 0, 0, 0])
            }, 50 + Math.random() * 100)
            break

          case 'chromatic':
            setChromaticOffset({
              r: (Math.random() - 0.5) * 12,
              g: 0,
              b: (Math.random() - 0.5) * 12
            })
            setTimeout(() => {
              setGlitchEffect('none')
              setChromaticOffset({ r: 0, g: 0, b: 0 })
            }, 100 + Math.random() * 150)
            break

          case 'static':
            const noiseLines = lines.map(line =>
              line.split('').map(char => {
                if (Math.random() < 0.3) {
                  const noiseChars = '░▒▓█▀▄╔╗╚╝║═'
                  return noiseChars[Math.floor(Math.random() * noiseChars.length)]
                }
                return char
              }).join('')
            )
            setStaticNoise(noiseLines)
            setTimeout(() => {
              setGlitchEffect('none')
              setStaticNoise([])
            }, 60 + Math.random() * 80)
            break

          case 'shift':
            const swapIdx = Math.floor(Math.random() * (lines.length - 1))
            const shiftedContent = [...lines]
            ;[shiftedContent[swapIdx], shiftedContent[swapIdx + 1]] =
             [shiftedContent[swapIdx + 1], shiftedContent[swapIdx]]
            setGlitchedContent(shiftedContent)
            setGlitchLines(lines.map((_, i) => i))
            setTimeout(() => {
              setGlitchEffect('none')
              setGlitchLines([])
            }, 40 + Math.random() * 60)
            break

          case 'flicker':
            let flickerCount = 0
            const flickerInterval = setInterval(() => {
              setFlickerOpacity(Math.random() < 0.5 ? 0.1 : 1)
              flickerCount++
              if (flickerCount > 6) {
                clearInterval(flickerInterval)
                setFlickerOpacity(1)
                setGlitchEffect('none')
              }
            }, 30)
            break

          case 'invert':
            setTimeout(() => setGlitchEffect('none'), 80 + Math.random() * 100)
            break
        }
      }
    }, 800 + Math.random() * 1500)

    return () => clearInterval(glitchInterval)
  }, [isComplete, lines])

  useEffect(() => {
    if (!isComplete) return
    const ambientInterval = setInterval(() => {
      if (Math.random() < 0.1 && glitchEffect === 'none') {
        const targetLine = Math.floor(Math.random() * lines.length)
        setGlitchLines([targetLine])
        setGlitchedContent([corruptText(lines[targetLine], 0.08)])
        setTimeout(() => setGlitchLines([]), 50)
      }
    }, 300)
    return () => clearInterval(ambientInterval)
  }, [isComplete, glitchEffect, lines])

  if (!started) return null

  const displayLines = glitchEffect === 'runes' && runeLines.length > 0
    ? runeLines
    : staticNoise.length > 0
    ? staticNoise
    : lines

  return (
    <div
      className="relative"
      style={{ opacity: flickerOpacity }}
    >
      {glitchEffect === 'chromatic' && (
        <pre
          className="absolute text-red-500/60 leading-none text-[8px] sm:text-[10px] md:text-xs overflow-x-auto pointer-events-none"
          style={{ transform: `translate(${chromaticOffset.r}px, ${chromaticOffset.r * 0.3}px)` }}
        >
          {lines.map((line, i) => <div key={i}>{line}</div>)}
        </pre>
      )}

      {glitchEffect === 'chromatic' && (
        <pre
          className="absolute text-cyan-500/60 leading-none text-[8px] sm:text-[10px] md:text-xs overflow-x-auto pointer-events-none"
          style={{ transform: `translate(${chromaticOffset.b}px, ${chromaticOffset.b * -0.3}px)` }}
        >
          {lines.map((line, i) => <div key={i}>{line}</div>)}
        </pre>
      )}

      <pre
        className={`leading-none text-[8px] sm:text-[10px] md:text-xs overflow-x-auto transition-none ${
          glitchEffect === 'invert' ? 'bg-white text-black' : 'text-white'
        } ${glitchEffect === 'runes' ? 'text-green-400' : ''}`}
        style={glitchEffect === 'runes' ? {
          textShadow: '0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.4)',
          filter: 'blur(0.3px)'
        } : undefined}
      >
        {displayLines.slice(0, visibleLines).map((line, i) => {
          const isGlitched = glitchLines.includes(i)
          const content = isGlitched && glitchedContent[glitchLines.indexOf(i)]
            ? glitchedContent[glitchLines.indexOf(i)]
            : line

          return (
            <div
              key={i}
              className="animate-[fadeIn_0.1s_ease-out]"
              style={{
                transform: glitchEffect === 'tear' ? `translateX(${lineOffsets[i]}px)` : undefined,
                textShadow: isGlitched ? '-3px 0 red, 3px 0 cyan' : undefined,
              }}
            >
              {content}
            </div>
          )
        })}
        {!isComplete && (
          <span className="text-green-500 animate-pulse">█</span>
        )}
      </pre>

      {glitchEffect === 'static' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  )
}

// Menu item component
function TerminalMenuItem({
  href,
  number,
  label,
  description,
  color,
  dimColor,
  delay = 0
}: {
  href: string
  number: string
  label: string
  description: string
  color: string
  dimColor: string
  delay?: number
}) {
  const [complete, setComplete] = useState(false)
  const fullText = `[${number}] ${label}`

  return (
    <Link href={href} className={`block hover:bg-white/5 px-2 -mx-2 ${color}`}>
      <TypeLine
        delay={delay}
        speed={25}
        glitchIntensity={0.06}
        className="inline"
        showCursor={!complete}
        onComplete={() => setComplete(true)}
      >
        {fullText}
      </TypeLine>
      {complete && <span className="text-gray-600 text-xs"> - {description}</span>}
    </Link>
  )
}

export default function HomePage() {
  const { showBoot, completeBoot, isLoaded: bootLoaded } = useBootSequence()
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode, toggleSanityMode, isLoaded: sanityLoaded } = useSanityMode()

  const [hasPlayedAnimation, setHasPlayedAnimation] = useState<boolean | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [systemLogs, setSystemLogs] = useState<string[]>(['System boot initiated...'])

  useEffect(() => {
    const played = sessionStorage.getItem('cthu-animation-played')
    if (played === 'true') {
      setHasPlayedAnimation(true)
      setAnimationPhase(12)
      setSystemLogs([
        'System boot initiated...',
        'Initializing neural interface...',
        'Loading on-chain data... OK',
        'Connecting to RPC... OK',
        'Syncing with chain ID 143... OK',
        'System ready. [INFO MODE]',
      ])
    } else {
      setHasPlayedAnimation(false)
    }
  }, [])

  // Read burned CTHU balance
  const { data: burnedBalance } = useReadContract({
    address: CONTRACTS.mainnet.CTHUCOIN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [BURN_ADDRESS as `0x${string}`],
  })

  // Read CTHU/MONAD pair reserves for TVL
  const { data: pairReserves } = useReadContract({
    address: CONTRACTS.mainnet.CTHU_MONAD_PAIR as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'getReserves',
  })

  const { data: token0 } = useReadContract({
    address: CONTRACTS.mainnet.CTHU_MONAD_PAIR as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'token0',
  })

  const burnedAmount = burnedBalance
    ? Number(formatEther(burnedBalance)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '---,---'

  const tvlInMonad = (() => {
    if (!pairReserves || !token0) return null
    const isCthuToken0 = token0.toLowerCase() === CONTRACTS.mainnet.CTHUCOIN.toLowerCase()
    const monadReserve = isCthuToken0 ? pairReserves[1] : pairReserves[0]
    return Number(formatEther(monadReserve)) * 2
  })()

  const tvlDisplay = tvlInMonad
    ? `${tvlInMonad.toLocaleString(undefined, { maximumFractionDigits: 0 })} MON`
    : '$---,---'

  useEffect(() => {
    if (showBoot || !bootLoaded || !sanityLoaded || hasPlayedAnimation === null) return
    if (hasPlayedAnimation) return

    const logSequence = [
      { delay: 100, log: 'Initializing neural interface...' },
      { delay: 400, log: 'Loading on-chain data... OK' },
      { delay: 700, log: 'Connecting to RPC... OK' },
      { delay: 1000, log: 'Syncing with chain ID 143... OK' },
      { delay: 1300, log: 'System ready. [INFO MODE]' },
    ]

    logSequence.forEach(({ delay, log }) => {
      setTimeout(() => {
        setSystemLogs(prev => [...prev, log])
      }, delay)
    })

    const phases = [
      { phase: 1, delay: 200 },
      { phase: 2, delay: 1200 },
      { phase: 3, delay: 1700 },
      { phase: 4, delay: 3200 },
      { phase: 5, delay: 3600 },
      { phase: 6, delay: 4000 },
      { phase: 7, delay: 4400 },
      { phase: 8, delay: 4800 },
      { phase: 9, delay: 5200 },
      { phase: 12, delay: 5800 },
    ]

    phases.forEach(({ phase, delay }) => {
      setTimeout(() => {
        setAnimationPhase(phase)
        if (phase === 12) {
          sessionStorage.setItem('cthu-animation-played', 'true')
        }
      }, delay)
    })
  }, [showBoot, bootLoaded, sanityLoaded, hasPlayedAnimation])

  if (!bootLoaded || !sanityLoaded || hasPlayedAnimation === null) {
    return (
      <div className="min-h-screen bg-black p-4 font-mono text-white">
        <span className="opacity-50">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black crt-effect overflow-hidden">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <EldritchGlitchOverlay active={!showBoot && !hasPlayedAnimation && animationPhase < 12} intensity={animationPhase < 6 ? 1.2 : 0.6} />

      {showBoot ? (
        <BootSequence onComplete={completeBoot} />
      ) : (
        <div className="p-4 font-mono text-base text-white flex justify-center">
          <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-start gap-4">
            {/* Left Panel - Main Content */}
            <div className="flex-1 flex flex-col">
              {animationPhase >= 1 && (
                <TypeLine
                  delay={0}
                  speed={18}
                  glitchIntensity={0.12}
                  className="text-gray-500 text-xs mb-2"
                >
                  CTHU-OS v0.6.6.6 [MONAD MAINNET] | INFO DISPLAY MODE
                </TypeLine>
              )}

              {animationPhase >= 2 && (
                <TerminalAsciiLogo delay={0} />
              )}

              {animationPhase >= 3 && (
                <TypeLine
                  delay={0}
                  speed={35}
                  glitchIntensity={0.15}
                  className="text-gray-500 text-xs mb-3 italic"
                >
                  Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn
                </TypeLine>
              )}

              {/* Info Notice */}
              {animationPhase >= 4 && (
                <div className="mb-3 p-2 border border-gray-800 bg-gray-950/50 text-xs text-gray-500">
                  This is an information-only display. No transactions available through this interface.
                </div>
              )}

              {animationPhase >= 5 && (
                <TypeLine
                  delay={0}
                  speed={25}
                  glitchIntensity={0.05}
                  className="text-gray-400 mb-1 text-sm"
                  showCursor={false}
                >
                  SELECT MODULE:
                </TypeLine>
              )}

              {/* Menu Items - Info only */}
              <div className="mb-3 space-y-0 text-sm">
                {animationPhase >= 6 && (
                  <TerminalMenuItem
                    href="/farm"
                    number="1"
                    label="THE VOID"
                    description="Peer into the abyss"
                    color="text-purple-700 hover:text-purple-500"
                    dimColor="text-purple-900"
                    delay={0}
                  />
                )}
                {animationPhase >= 7 && (
                  <TerminalMenuItem
                    href="/contracts"
                    number="2"
                    label="CONTRACTS"
                    description="View contract addresses"
                    color="text-blue-600 hover:text-blue-400"
                    dimColor="text-blue-900"
                    delay={0}
                  />
                )}
                {animationPhase >= 8 && (
                  <TerminalMenuItem
                    href="/roadmap"
                    number="3"
                    label="ROADMAP"
                    description="Project information"
                    color="text-gray-400 hover:text-white"
                    dimColor="text-gray-600"
                    delay={0}
                  />
                )}
              </div>

              {/* Stats */}
              {animationPhase >= 9 && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <div className="text-gray-700 text-xs mb-3">{'-'.repeat(50)}</div>
                  <div className="mb-3 p-3 border border-emerald-900/50 bg-emerald-950/20 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none opacity-10">
                      <div className="h-full w-full" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)'
                      }} />
                    </div>

                    <div className="space-y-2 relative z-10">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">TVL:</span>
                          <span className="text-emerald-400 font-bold">{tvlDisplay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">BURNED:</span>
                          <span className="text-orange-400 font-bold">{burnedAmount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">SUPPLY:</span>
                          <span className="text-cyan-400 font-bold">1B CTHU</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <span className="text-gray-500">FARM ALLOCATION:</span>
                        <span className="text-yellow-400 font-bold">885M CTHU</span>
                        <span className="text-gray-600">(4 years)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Command Prompt */}
              <div className="mt-auto pt-2 border-t border-gray-800 text-sm">
                <span className="text-gray-500">observer@cthu-os:~$</span>{' '}
                <BlinkingCursor />
              </div>
            </div>

            {/* Right Panel */}
            <div className="lg:sticky lg:top-6 lg:h-fit lg:w-80 flex flex-col">
              <div className="mb-4 flex justify-center overflow-hidden" style={{ height: '280px' }}>
                {animationPhase >= 6 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                  >
                    <ChromaticCthulhu />
                  </motion.div>
                )}
              </div>

              <TerminalLog
                title="system.log"
                headerColor="text-white"
                headerTitle="CTHU-OS SYSTEM"
                staticInfo={[
                  { label: 'Version', value: '0.6.6.6' },
                  { label: 'Mode', value: 'INFO ONLY' },
                  { label: 'Chain', value: 'Monad (143)' },
                ]}
                logs={systemLogs}
                statusText="Observing"
                statusColor="green"
              />
              <button
                onClick={toggleSanityMode}
                className="text-gray-700 hover:text-gray-500 text-xs mt-2 text-left"
              >
                [SANITY_MODE: {sanityMode ? 'ON' : 'OFF'}]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
