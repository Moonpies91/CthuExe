'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { Navigation } from '@/components/common/Navigation'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useAccount } from 'wagmi'

export default function LiquidityPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const { isConnected } = useAccount()

  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [tokenA, setTokenA] = useState('CTHU')
  const [tokenB, setTokenB] = useState('MONAD')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')

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
            <h1 className="text-2xl font-bold text-cthu-cyan mb-2">
              &gt; LIQUIDITY
            </h1>
            <p className="text-gray-500 text-sm">
              Add or remove liquidity to earn trading fees
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-2 text-sm border ${
                mode === 'add'
                  ? 'border-cthu-green text-cthu-green'
                  : 'border-gray-700 text-gray-500'
              }`}
            >
              ADD
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`flex-1 py-2 text-sm border ${
                mode === 'remove'
                  ? 'border-cthu-green text-cthu-green'
                  : 'border-gray-700 text-gray-500'
              }`}
            >
              REMOVE
            </button>
          </div>

          {/* Liquidity Card */}
          <div className="terminal-card">
            {mode === 'add' ? (
              <>
                {/* Token A Input */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>TOKEN A</span>
                    <span>Balance: --</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value)}
                      placeholder="0.0"
                      className="terminal-input flex-1"
                    />
                    <button className="terminal-button min-w-[100px]">
                      {tokenA}
                    </button>
                  </div>
                </div>

                {/* Plus Icon */}
                <div className="flex justify-center my-4">
                  <div className="w-10 h-10 border border-gray-700 flex items-center justify-center text-gray-500">
                    +
                  </div>
                </div>

                {/* Token B Input */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>TOKEN B</span>
                    <span>Balance: --</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amountB}
                      onChange={(e) => setAmountB(e.target.value)}
                      placeholder="0.0"
                      className="terminal-input flex-1"
                    />
                    <button className="terminal-button min-w-[100px]">
                      {tokenB}
                    </button>
                  </div>
                </div>

                {/* Pool Info */}
                <div className="border-t border-gray-800 pt-4 mb-4 text-xs text-gray-500">
                  <div className="flex justify-between mb-1">
                    <span>Pool Share</span>
                    <span>--%</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>LP Tokens</span>
                    <span>--</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <span>1 {tokenA} = -- {tokenB}</span>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  className="terminal-button w-full py-3"
                  disabled={!isConnected || !amountA || !amountB}
                >
                  {!isConnected
                    ? 'CONNECT WALLET'
                    : !amountA || !amountB
                      ? 'ENTER AMOUNTS'
                      : 'ADD LIQUIDITY'}
                </button>
              </>
            ) : (
              <>
                {/* Remove Mode */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">LP AMOUNT</div>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="terminal-input w-full mb-2"
                  />
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        className="flex-1 py-1 text-xs border border-gray-700 text-gray-500 hover:border-cthu-green hover:text-cthu-green"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Preview */}
                <div className="border-t border-gray-800 pt-4 mb-4 text-xs">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">You will receive</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white">-- {tokenA}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">-- {tokenB}</span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  className="terminal-button w-full py-3"
                  disabled={!isConnected}
                >
                  {!isConnected ? 'CONNECT WALLET' : 'REMOVE LIQUIDITY'}
                </button>
              </>
            )}
          </div>

          {/* Your Positions */}
          <div className="mt-8 terminal-card">
            <div className="text-cthu-green mb-3">&gt; YOUR POSITIONS</div>
            <div className="text-center text-gray-500 py-4">
              {isConnected ? 'No liquidity positions found' : 'Connect wallet to view positions'}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
