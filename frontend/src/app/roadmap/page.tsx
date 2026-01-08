'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@/config/contracts'

const FARM_ABI = [
  { name: 'farmLocked', type: 'function', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const

// Roadmap item type
interface RoadmapItem {
  text: string
  done: boolean
  critical?: boolean
}

interface RoadmapPhase {
  id: string
  name: string
  subtitle: string
  status: 'complete' | 'active' | 'pending'
  items: RoadmapItem[]
}

// Roadmap phases with eldritch naming
const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase-1',
    name: 'THE AWAKENING',
    subtitle: 'Foundation',
    status: 'complete' as const,
    items: [
      { text: 'Deploy CTHU token (1B supply)', done: true },
      { text: 'Deploy CthuSwap DEX (Factory, Router, Pairs)', done: true },
      { text: 'Deploy CthuFarm with 885M CTHU rewards', done: true },
      { text: 'Create initial CTHU/MONAD liquidity pool', done: true },
      { text: 'Launch frontend interface', done: true },
    ],
  },
  {
    id: 'phase-2',
    name: 'THE BINDING',
    subtitle: 'Security & Trust',
    status: 'active' as const,
    items: [
      { text: 'Complete security audit', done: true },
      { text: 'Verify all contracts on explorer', done: true },
      { text: 'Lock farm rewards (885M CTHU)', done: false, critical: true },
      { text: 'Burn initial LP tokens', done: false, critical: true },
      { text: 'Publish transparency report', done: false },
    ],
  },
  {
    id: 'phase-3',
    name: 'THE SUMMONING',
    subtitle: 'Launchpad & Community',
    status: 'pending' as const,
    items: [
      { text: 'Activate Cultist Launchpad', done: false },
      { text: 'First community token launch', done: false },
      { text: 'Implement burn leaderboard', done: false },
      { text: 'Community governance discussions', done: false },
    ],
  },
  {
    id: 'phase-4',
    name: 'THE ASCENSION',
    subtitle: 'Expansion',
    status: 'pending' as const,
    items: [
      { text: 'Cross-chain bridge exploration', done: false },
      { text: 'Advanced farming strategies', done: false },
      { text: 'Partnership integrations', done: false },
      { text: 'Mobile-optimized interface', done: false },
    ],
  },
  {
    id: 'phase-5',
    name: 'THE ETERNAL',
    subtitle: 'Decentralization',
    status: 'pending' as const,
    items: [
      { text: 'DAO governance implementation', done: false },
      { text: 'Multi-sig treasury transition', done: false },
      { text: 'Community-driven development', done: false },
      { text: 'Full protocol decentralization', done: false },
    ],
  },
]

// ASCII progress bar
function AsciiProgressBar({ percent, width = 20 }: { percent: number; width?: number }) {
  const filled = Math.floor((percent / 100) * width)
  const empty = width - filled
  return (
    <span className="font-mono text-xs">
      [{'█'.repeat(filled)}{'░'.repeat(empty)}] {percent.toFixed(0)}%
    </span>
  )
}

// Phase status indicator
function PhaseStatus({ status }: { status: 'complete' | 'active' | 'pending' }) {
  switch (status) {
    case 'complete':
      return <span className="text-green-500">[COMPLETE]</span>
    case 'active':
      return <span className="text-amber-500 animate-pulse">[ACTIVE]</span>
    case 'pending':
      return <span className="text-gray-600">[PENDING]</span>
  }
}

export default function RoadmapPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const [expandedPhase, setExpandedPhase] = useState<string | null>('phase-2')

  // Check if farm is locked on-chain
  const { data: farmLocked } = useReadContract({
    address: CONTRACTS.mainnet.FARM as `0x${string}`,
    abi: FARM_ABI,
    functionName: 'farmLocked',
  })

  // Calculate phase completion
  const getPhaseProgress = (phase: RoadmapPhase) => {
    const completed = phase.items.filter(item => item.done).length
    return (completed / phase.items.length) * 100
  }

  return (
    <div className="min-h-screen bg-black crt-effect">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <div className="p-6 font-mono text-base text-white">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-gray-400 mb-1">CTHU-OS v0.6.6.6</div>
          <div className="text-gray-600 mb-4">{'='.repeat(50)}</div>

          <div className="mb-4">
            <Link href="/" className="text-gray-600 hover:text-gray-400">{'<'} BACK TO MAIN</Link>
          </div>

          <div className="text-white mb-2 text-lg">ROADMAP.exe</div>
          <div className="text-gray-500 mb-6 text-sm italic">
            "That is not dead which can eternal lie..."
          </div>

          <div className="text-gray-600 mb-6">{'-'.repeat(50)}</div>

          {/* Security Status Banner */}
          <div className="mb-6 p-4 border border-gray-800 bg-gray-950">
            <div className="text-gray-400 mb-2 text-sm">PROTOCOL SECURITY STATUS:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Farm Lock:</span>
                {farmLocked ? (
                  <span className="text-green-500">[LOCKED]</span>
                ) : (
                  <span className="text-amber-500">[PENDING]</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">LP Tokens:</span>
                <span className="text-amber-500">[BURN PENDING]</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Audit:</span>
                <span className="text-green-500">[COMPLETE]</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Contracts:</span>
                <span className="text-green-500">[VERIFIED]</span>
              </div>
            </div>
          </div>

          {/* Critical Actions Box */}
          <div className="mb-6 p-4 border border-amber-900/50 bg-amber-950/20">
            <div className="text-amber-500 mb-3 flex items-center gap-2">
              <span className="animate-pulse">▶</span>
              PENDING SECURITY ACTIONS:
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-amber-600">[1]</span>
                <div>
                  <div className="text-amber-400">LOCK FARM REWARDS</div>
                  <div className="text-gray-500 text-xs mt-1">
                    Calling lockFarm() permanently prevents owner from recovering 885M CTHU rewards.
                    Users can always withdraw their LP tokens and harvest rewards.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-600">[2]</span>
                <div>
                  <div className="text-amber-400">BURN LP TOKENS</div>
                  <div className="text-gray-500 text-xs mt-1">
                    Sending initial LP tokens to 0xdead permanently locks liquidity.
                    Creates a permanent price floor - liquidity can never be pulled.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-gray-600 mb-6">{'-'.repeat(50)}</div>

          {/* Roadmap Phases */}
          <div className="space-y-4">
            {ROADMAP_PHASES.map((phase) => {
              const progress = getPhaseProgress(phase)
              const isExpanded = expandedPhase === phase.id

              return (
                <div
                  key={phase.id}
                  className={`border ${
                    phase.status === 'active'
                      ? 'border-amber-800/50 bg-amber-950/10'
                      : phase.status === 'complete'
                      ? 'border-green-900/50 bg-green-950/10'
                      : 'border-gray-800 bg-gray-950/50'
                  }`}
                >
                  {/* Phase Header */}
                  <button
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">{isExpanded ? '[-]' : '[+]'}</span>
                        <span className={`font-bold ${
                          phase.status === 'active'
                            ? 'text-amber-400'
                            : phase.status === 'complete'
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }`}>
                          {phase.name}
                        </span>
                        <span className="text-gray-600 text-sm">- {phase.subtitle}</span>
                      </div>
                      <PhaseStatus status={phase.status} />
                    </div>
                    <div className={`${
                      phase.status === 'active'
                        ? 'text-amber-600'
                        : phase.status === 'complete'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      <AsciiProgressBar percent={progress} width={30} />
                    </div>
                  </button>

                  {/* Phase Items */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                      <div className="text-gray-700 mb-2">{'-'.repeat(40)}</div>
                      {phase.items.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 text-sm ${
                            item.done ? 'text-gray-500' : item.critical ? 'text-amber-400' : 'text-gray-400'
                          }`}
                        >
                          <span className={item.done ? 'text-green-500' : item.critical ? 'text-amber-500' : 'text-gray-600'}>
                            {item.done ? '[x]' : item.critical ? '[!]' : '[ ]'}
                          </span>
                          <span className={item.done ? 'line-through' : ''}>
                            {item.text}
                          </span>
                          {item.critical && !item.done && (
                            <span className="text-amber-600 text-xs">(CRITICAL)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="text-gray-600 my-6">{'-'.repeat(50)}</div>

          {/* Trust Model Explanation */}
          <div className="mb-6 p-4 border border-gray-800">
            <div className="text-gray-400 mb-3">TRUST MODEL:</div>
            <pre className="text-xs text-gray-500 overflow-x-auto">
{`┌─────────────────────────────────────────────────────────┐
│  BEFORE LOCK                                            │
│  ├── Owner CAN recover farm rewards                     │
│  └── Owner CAN pull LP tokens                           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼  lockFarm() + burn LP
┌─────────────────────────────────────────────────────────┐
│  AFTER LOCK                                             │
│  ├── 885M CTHU locked FOREVER in farm                   │
│  ├── Initial liquidity locked FOREVER                   │
│  ├── Users can ALWAYS withdraw + harvest                │
│  └── NO POSSIBLE RUG                                    │
└─────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          {/* Emission Schedule */}
          <div className="mb-6 p-4 border border-gray-800">
            <div className="text-gray-400 mb-3">FARM EMISSION SCHEDULE:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Year 1:</span>
                <span>400,000,000 CTHU @ 12.68/sec</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Year 2:</span>
                <span>200,000,000 CTHU @ 6.34/sec</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Year 3:</span>
                <span>100,000,000 CTHU @ 3.17/sec</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Year 4:</span>
                <span>185,000,000 CTHU @ 5.86/sec</span>
              </div>
              <div className="text-gray-700 my-2">{'-'.repeat(40)}</div>
              <div className="flex justify-between text-gray-400">
                <span>TOTAL:</span>
                <span>885,000,000 CTHU over 4 years</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-gray-600 text-xs">
            <div>Last updated: {new Date().toISOString().split('T')[0]}</div>
            <div className="mt-2">
              Contract addresses and audit reports available on request.
            </div>
          </div>

          {/* Prompt */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <span className="text-gray-500">roadmap@cthu-os:~$</span> <BlinkingCursor />
          </div>
        </div>
      </div>
    </div>
  )
}
