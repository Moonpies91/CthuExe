'use client'

import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

// Contract information
const CONTRACTS = [
  {
    name: 'CTHU.EXE',
    address: '0xb8957912629C4b69F4FDea5b804B6438385c59bd',
    description: 'ᚦᚨᛏ ᛁᛊ ᚾᛟᛏ ᛞᛖᚨᛞ ᚹᚺᛁᚲᚺ ᚲᚨᚾ ᛖᛏᛖᚱᚾᚨᛚ ᛚᛁᛖ',
    type: 'Token',
  },
  {
    name: 'THE VOID',
    address: '0x7DD345E93A6427Da795c3ca117CC5b4fa3e05849',
    description: 'Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn',
    type: 'Void',
  },
]

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Token: 'text-green-500 border-green-800',
    Void: 'text-purple-500 border-purple-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 border ${colors[type] || 'text-gray-500 border-gray-800'}`}>
      {type}
    </span>
  )
}

export default function ContractsPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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

          <div className="text-white mb-2 text-lg">CONTRACT REGISTRY</div>
          <div className="text-gray-500 mb-6 text-sm">
            Deployed on Monad Mainnet (Chain ID: 143)
          </div>

          <div className="text-gray-600 mb-6">{'-'.repeat(50)}</div>

          {/* Info Notice */}
          <div className="mb-6 p-4 border border-blue-900/50 bg-blue-950/20">
            <div className="text-blue-400 mb-2">INFORMATION ONLY</div>
            <div className="text-gray-500 text-sm">
              This page displays contract addresses for reference. All contracts are verified
              and source code is publicly available on the block explorer.
            </div>
          </div>

          {/* Contract List */}
          <div className="space-y-4">
            {CONTRACTS.map((contract) => (
              <div
                key={contract.address}
                className="border border-gray-800 bg-gray-950/50 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 font-bold">{contract.name}</span>
                    <TypeBadge type={contract.type} />
                  </div>
                </div>

                <div className="text-gray-500 text-sm mb-3">
                  {contract.description}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Address:</span>
                  <code className="text-green-500 bg-gray-900 px-2 py-1">
                    {contract.address}
                  </code>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => copyToClipboard(contract.address)}
                    className="text-gray-500 hover:text-gray-400 text-sm"
                  >
                    [Copy Address]
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-gray-600 my-6">{'-'.repeat(50)}</div>

          {/* Additional Info */}
          <div className="mb-6 p-4 border border-gray-800">
            <div className="text-gray-400 mb-3">NETWORK INFORMATION:</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Network:</span>
                <span className="text-gray-400">Monad Mainnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chain ID:</span>
                <span className="text-gray-400">143</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Native Token:</span>
                <span className="text-gray-400">MONAD</span>
              </div>
            </div>
          </div>

          {/* Burn Address */}
          <div className="mb-6 p-4 border border-gray-800">
            <div className="text-gray-400 mb-3">BURN ADDRESS:</div>
            <div className="flex items-center gap-2 text-sm">
              <code className="text-red-500 bg-gray-900 px-2 py-1">
                0x000000000000000000000000000000000000dEaD
              </code>
            </div>
            <div className="text-gray-600 text-xs mt-2">
              Standard burn address. Tokens sent here are permanently removed from circulation.
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-gray-700 text-xs">
            <p>All contracts are provided as-is. This is an experimental project.</p>
            <p className="mt-1">Verify all addresses before any interactions.</p>
          </div>

          {/* Prompt */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <span className="text-gray-500">observer@cthu-os:~$</span> <BlinkingCursor />
          </div>
        </div>
      </div>
    </div>
  )
}
