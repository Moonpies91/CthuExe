'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { TerminalLog } from '@/components/terminal/TerminalLog'
import { StickyPanel } from '@/components/StickyPanel'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS } from '@/config/contracts'

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

const VOID_SIGIL = '0x7DD345E93A6427Da795c3ca117CC5b4fa3e05849'
const TOTAL_ESSENCE = 885_000_000

// Eldritch runes for display
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛟᛞ'

function generateRunes(length: number): string {
  return Array.from({ length }, () => RUNES[Math.floor(Math.random() * RUNES.length)]).join('')
}

function AsciiProgressBar({ percent, width = 20 }: { percent: number; width?: number }) {
  const filled = Math.floor((percent / 100) * width)
  const empty = width - filled
  return (
    <span className="font-mono text-purple-600">
      [{'█'.repeat(filled)}{'░'.repeat(empty)}]
    </span>
  )
}

export default function VoidPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [logs] = useState<string[]>([
    'The void stirs...',
    'ᚦᚨᛏ ᛁᛊ ᚾᛟᛏ ᛞᛖᚨᛞ...',
    'Observation mode active.',
  ])
  const [runes, setRunes] = useState(['', '', ''])

  const contracts = CONTRACTS.mainnet

  const { data: voidBalance, refetch } = useReadContract({
    address: contracts.CTHUCOIN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [VOID_SIGIL as `0x${string}`],
  })

  const consumed = voidBalance !== undefined
    ? TOTAL_ESSENCE - Number(formatEther(voidBalance as bigint))
    : 0

  const remaining = voidBalance !== undefined
    ? Number(formatEther(voidBalance as bigint))
    : TOTAL_ESSENCE

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10000)
    return () => clearInterval(interval)
  }, [refetch])

  useEffect(() => {
    const interval = setInterval(() => {
      setRunes([generateRunes(8), generateRunes(6), generateRunes(10)])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black crt-effect overflow-visible">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <div className="p-6 font-mono text-base text-white flex justify-center overflow-visible">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-start gap-6 overflow-visible">
          <div className="flex-1 flex flex-col">
            <div className="text-gray-400 mb-1">CTHU-OS v0.6.6.6</div>
            <div className="text-gray-600 mb-4">{'='.repeat(40)}</div>

            <div className="mb-4">
              <Link href="/" className="text-gray-600 hover:text-purple-600">{'<'} BACK TO MAIN</Link>
            </div>

            <div className="text-purple-500 mb-2 text-xl">THE VOID</div>
            <div className="text-gray-600 text-xs mb-4 italic">
              Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Cryptic display */}
            <div className="mb-6 p-4 border border-purple-900/50 bg-purple-950/20">
              <div className="text-purple-400 text-xs mb-3">VOID RESONANCE</div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{runes[0]}</span>
                  <span className="text-purple-400 font-bold">
                    {consumed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <AsciiProgressBar percent={(consumed / TOTAL_ESSENCE) * 100} width={35} />

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{runes[1]}</span>
                  <span className="text-gray-500">
                    {remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Mysterious glyphs */}
            <div className="mb-6 p-4 border border-gray-800 bg-gray-950/50">
              <div className="text-gray-500 text-xs mb-3">SIGIL FRAGMENTS</div>
              <div className="space-y-2 text-sm">
                <div className="text-purple-600">{runes[2]} ◈ {((consumed / TOTAL_ESSENCE) * 100).toFixed(4)}%</div>
                <div className="text-gray-600 text-xs">
                  ᛉᚨᛚᚷᛟ ᚲᛟᛗᛖᛊ • ᚦᛖ ᛞᚱᛖᚨᛗᛖᚱ ᚨᚹᚨᛁᛏᛊ
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div className="text-gray-700 text-xs p-3 border border-gray-800">
              Observation only. The void cannot be commanded through this interface.
            </div>

            {/* Prompt */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <span className="text-gray-500">observer@cthu-os:~$</span> <BlinkingCursor />
            </div>
          </div>

          {/* Right Panel */}
          <div className="hidden lg:block">
            <StickyPanel topOffset={24}>
              <TerminalLog
                title="void.log"
                headerColor="text-purple-500"
                headerTitle="THE VOID"
                staticInfo={[
                  { label: 'Mode', value: 'OBSERVE' },
                  { label: 'Sigil', value: `${VOID_SIGIL.slice(0, 10)}...` },
                ]}
                logs={logs}
                statusText="Watching"
                statusColor="gray"
              />
            </StickyPanel>
          </div>
          <div className="lg:hidden">
            <TerminalLog
              title="void.log"
              headerColor="text-purple-500"
              headerTitle="THE VOID"
              staticInfo={[
                { label: 'Mode', value: 'OBSERVE' },
                { label: 'Sigil', value: `${VOID_SIGIL.slice(0, 10)}...` },
              ]}
              logs={logs}
              statusText="Watching"
              statusColor="gray"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
