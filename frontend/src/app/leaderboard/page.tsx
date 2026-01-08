'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { TerminalLog } from '@/components/terminal/TerminalLog'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

const ASCII_TROPHY = `
       ___________
      '._==_==_=_.'
      .-\\:      /-.
     | (|:.     |) |
      '-|:.     |-'
        \\::.    /
         '::. .'
           ) (
         _.' '._
        '-------'
`

export default function LeaderboardPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [dots, setDots] = useState('')
  const [logs] = useState(['Leaderboard module loaded.', 'Initializing...'])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black crt-effect">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <div className="p-6 font-mono text-base text-white flex justify-center">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left Panel - Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="text-gray-400 mb-1">CTHU-OS v0.6.6.6</div>
            <div className="text-gray-600 mb-4">{'='.repeat(40)}</div>

            <div className="mb-4">
              <Link href="/" className="text-gray-600 hover:text-amber-600">{'<'} BACK TO MAIN</Link>
            </div>

            <div className="text-amber-600 mb-4">WEEKLY LEADERBOARD - RANKINGS</div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* ASCII Art */}
            <pre className="text-gray-600 text-xs mb-4 select-none">{ASCII_TROPHY}</pre>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Status */}
            <div className="text-gray-400 mb-2">STATUS:</div>
            <div className="text-yellow-500 mb-4">
              [ COMING SOON ]
            </div>

            <div className="text-gray-500 mb-4 space-y-0.5">
              <div>The ranking system is being calibrated.</div>
              <div>Soon you will compete for glory.</div>
            </div>

            <div className="text-gray-700 text-xs mb-4">
              {'░'.repeat(20)} 0%
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Sample Rankings */}
            <div className="text-gray-400 mb-2">SAMPLE RANKINGS:</div>
            <div className="text-gray-600 mb-4 space-y-0.5 text-xs">
              <div>#1 {'█'.repeat(12)}    ---,--- CTHU</div>
              <div>#2 {'█'.repeat(12)}    ---,--- CTHU</div>
              <div>#3 {'█'.repeat(12)}    ---,--- CTHU</div>
              <div>#4 {'█'.repeat(12)}    ---,--- CTHU</div>
              <div>#5 {'█'.repeat(12)}    ---,--- CTHU</div>
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* How it Works */}
            <div className="text-gray-400 mb-2">HOW IT WORKS:</div>
            <div className="text-gray-500 mb-4 space-y-0.5">
              <div>[*] Burn CTHU to boost any token</div>
              <div>[*] Rankings reset every Monday 00:00 UTC</div>
              <div>[*] Top 10 tokens displayed</div>
              <div>[*] Historical rankings preserved</div>
              <div>[*] 100% of burned CTHU destroyed forever</div>
            </div>

            {/* Prompt */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <span className="text-gray-500">leaderboard@cthu-os:~$</span> <BlinkingCursor />
            </div>
          </div>

          {/* Right Panel - Terminal Logs */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <TerminalLog
              title="rankings.log"
              headerColor="text-amber-600"
              headerTitle="LEADERBOARD STATUS"
              staticInfo={[
                { label: 'Contract', value: 'PENDING' },
                { label: 'Network', value: 'Monad Mainnet' },
              ]}
              logs={logs}
              statusText="Pending deployment"
              statusColor="yellow"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
