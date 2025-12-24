'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { Navigation } from '@/components/common/Navigation'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useAccount } from 'wagmi'

export default function SwapPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const { isConnected } = useAccount()

  const [fromToken, setFromToken] = useState('MONAD')
  const [toToken, setToToken] = useState('CTHU')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  return (
    <div className="min-h-screen bg-cthu-black crt-effect">
      <Scanlines />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <Navigation />

      <main className="max-w-lg mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-cthu-green mb-2">
              &gt; CTHUSWAP
            </h1>
            <p className="text-gray-500 text-sm">
              Trade tokens on the Eldritch Exchange
            </p>
          </div>

          {/* Swap Card */}
          <div className="terminal-card">
            {/* From Token */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>FROM</span>
                <span>Balance: --</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="terminal-input flex-1"
                />
                <button className="terminal-button min-w-[100px]">
                  {fromToken}
                </button>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center my-4">
              <button
                onClick={handleSwapTokens}
                className="w-10 h-10 border border-gray-700 flex items-center justify-center hover:border-cthu-green hover:text-cthu-green transition-colors"
              >
                ↕
              </button>
            </div>

            {/* To Token */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>TO</span>
                <span>Balance: --</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.0"
                  className="terminal-input flex-1"
                  readOnly
                />
                <button className="terminal-button min-w-[100px]">
                  {toToken}
                </button>
              </div>
            </div>

            {/* Swap Details */}
            <div className="border-t border-gray-800 pt-4 mb-4 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Rate</span>
                <span>1 {fromToken} = -- {toToken}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Price Impact</span>
                <span className="text-cthu-green">&lt; 0.01%</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Slippage Tolerance</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Fee (0.30%)</span>
                <span>-- {fromToken}</span>
              </div>
            </div>

            {/* Slippage Settings */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">SLIPPAGE</div>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`px-3 py-1 text-xs border ${
                      slippage === val
                        ? 'border-cthu-green text-cthu-green'
                        : 'border-gray-700 text-gray-500'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="terminal-input w-20 text-xs"
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Swap Button */}
            {isConnected ? (
              <button
                className="terminal-button w-full py-3"
                disabled={!fromAmount}
              >
                {!fromAmount ? 'ENTER AMOUNT' : 'SWAP'}
              </button>
            ) : (
              <button className="terminal-button w-full py-3" disabled>
                CONNECT WALLET
              </button>
            )}
          </div>

          {/* Fee Distribution Info */}
          <div className="mt-6 text-xs text-gray-600 text-center">
            <p>Fee Distribution: 0.20% LP | 0.05% Stakers | 0.05% Burn</p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
