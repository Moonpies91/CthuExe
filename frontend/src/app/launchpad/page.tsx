'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { TerminalLog } from '@/components/terminal/TerminalLog'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

const ASCII_PORTAL = `
     .  *  .    *   .  *
  *    _____     *    .
   *  /     \\  *   *
  .  |  ???  |   .    *
 *   |       |  *  .
  .   \\_____/    *   .
    *   | |   *    *
  .   * | | *   .    *
`

export default function LaunchpadPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [dots, setDots] = useState('')
  const [logs] = useState(['Launchpad module loaded.', 'Awaiting deployment...'])

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
              <Link href="/" className="text-gray-600 hover:text-violet-500">{'<'} BACK TO MAIN</Link>
            </div>

            <div className="text-violet-500 mb-4">CULTIST LAUNCHPAD - SUMMON MODULE</div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* ASCII Art */}
            <pre className="text-gray-600 text-xs mb-4 select-none">{ASCII_PORTAL}</pre>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Status */}
            <div className="text-gray-400 mb-2">STATUS:</div>
            <div className="text-yellow-500 mb-4">
              [ COMING SOON ]
            </div>

            <div className="text-gray-500 mb-4 space-y-0.5">
              <div>The summoning ritual is being prepared.</div>
              <div>Soon you will be able to launch tokens.</div>
            </div>

            <div className="text-gray-700 text-xs mb-4">
              {'░'.repeat(20)} 0%
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Features */}
            <div className="text-gray-400 mb-2">PLANNED FEATURES:</div>
            <div className="text-gray-500 mb-4 space-y-0.5">
              <div>[*] Fair launch bonding curves</div>
              <div>[*] Automatic LP creation</div>
              <div>[*] LP tokens burned on graduation</div>
              <div>[*] No presales, fair launch only</div>
              <div>[*] 100 MON launch fee (burned as CTHU)</div>
            </div>

            {/* Prompt */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <span className="text-gray-500">launchpad@cthu-os:~$</span> <BlinkingCursor />
            </div>
          </div>

          {/* Right Panel - Terminal Logs */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <TerminalLog
              title="launchpad.log"
              headerColor="text-violet-500"
              headerTitle="LAUNCHPAD STATUS"
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
