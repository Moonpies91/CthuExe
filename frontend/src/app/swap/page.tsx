'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { TerminalLog } from '@/components/terminal/TerminalLog'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { CONTRACTS } from '@/config/contracts'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

const ROUTER_ABI = [
  { name: 'swapExactMONADForTokens', type: 'function', inputs: [{ name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'payable' },
  { name: 'swapExactTokensForMONAD', type: 'function', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable' },
] as const

const PAIR_ABI = [
  { name: 'getReserves', type: 'function', inputs: [], outputs: [{ name: 'reserve0', type: 'uint112' }, { name: 'reserve1', type: 'uint112' }, { name: 'blockTimestampLast', type: 'uint32' }], stateMutability: 'view' },
  { name: 'token0', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
] as const

export default function SwapPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()
  const { isConnected, address } = useAccount()
  const [fromToken, setFromToken] = useState<'MON' | 'CTHU'>('MON')
  const [toToken, setToToken] = useState<'MON' | 'CTHU'>('CTHU')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage] = useState('0.5')
  const [logs, setLogs] = useState<string[]>([])
  const [needsApproval, setNeedsApproval] = useState(false)

  const contracts = CONTRACTS.mainnet
  const PAIR_ADDRESS = contracts.CTHU_MONAD_PAIR as `0x${string}`

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-8), msg])

  const { data: cthuBalance } = useReadContract({
    address: contracts.CTHUCOIN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: monBalance } = useBalance({ address })

  const { data: cthuAllowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.CTHUCOIN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.ROUTER as `0x${string}`] : undefined,
  })

  const { data: reserves } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: 'getReserves',
  })

  const { data: token0 } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: 'token0',
  })

  // Get reserves in a typed way
  const getReserves = useCallback(() => {
    if (!reserves || !token0) return { cthuReserve: 0n, monReserve: 0n }
    const [reserve0, reserve1] = reserves
    const isCthuToken0 = token0?.toLowerCase() === contracts.CTHUCOIN.toLowerCase()
    return {
      cthuReserve: isCthuToken0 ? reserve0 : reserve1,
      monReserve: isCthuToken0 ? reserve1 : reserve0,
    }
  }, [reserves, token0, contracts.CTHUCOIN])

  // Calculate current price (CTHU per MON)
  const currentPrice = useMemo(() => {
    const { cthuReserve, monReserve } = getReserves()
    if (monReserve === 0n) return 0
    return Number(cthuReserve) / Number(monReserve)
  }, [getReserves])

  // Calculate price after swap (for price impact)
  const calculatePriceImpact = useCallback((inputAmount: string, isMonToCthu: boolean) => {
    if (!inputAmount || parseFloat(inputAmount) === 0) return 0
    const { cthuReserve, monReserve } = getReserves()
    if (cthuReserve === 0n || monReserve === 0n) return 0

    try {
      const amountIn = parseEther(inputAmount)
      const amountInWithFee = amountIn * 997n

      let newCthuReserve: bigint
      let newMonReserve: bigint

      if (isMonToCthu) {
        // Buying CTHU with MON
        const numerator = amountInWithFee * cthuReserve
        const denominator = monReserve * 1000n + amountInWithFee
        const amountOut = numerator / denominator
        newCthuReserve = cthuReserve - amountOut
        newMonReserve = monReserve + amountIn
      } else {
        // Selling CTHU for MON
        const numerator = amountInWithFee * monReserve
        const denominator = cthuReserve * 1000n + amountInWithFee
        const amountOut = numerator / denominator
        newCthuReserve = cthuReserve + amountIn
        newMonReserve = monReserve - amountOut
      }

      // Calculate prices
      const priceBefore = Number(cthuReserve) / Number(monReserve)
      const priceAfter = Number(newCthuReserve) / Number(newMonReserve)

      // Price impact as percentage
      const impact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100
      return impact
    } catch {
      return 0
    }
  }, [getReserves])

  const priceImpact = useMemo(() => {
    return calculatePriceImpact(fromAmount, fromToken === 'MON')
  }, [fromAmount, fromToken, calculatePriceImpact])

  const calculateOutput = useCallback((inputAmount: string, isMonToCthu: boolean) => {
    if (!inputAmount || !reserves || parseFloat(inputAmount) === 0) return '0'
    try {
      const { cthuReserve, monReserve } = getReserves()
      const amountIn = parseEther(inputAmount)
      const reserveIn = isMonToCthu ? monReserve : cthuReserve
      const reserveOut = isMonToCthu ? cthuReserve : monReserve
      const amountInWithFee = amountIn * 997n
      const numerator = amountInWithFee * reserveOut
      const denominator = reserveIn * 1000n + amountInWithFee
      return formatEther(numerator / denominator)
    } catch { return '0' }
  }, [reserves, getReserves])

  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      setToAmount(calculateOutput(fromAmount, fromToken === 'MON'))
    } else {
      setToAmount('')
    }
  }, [fromAmount, fromToken, calculateOutput])

  useEffect(() => {
    if (fromToken === 'CTHU' && cthuAllowance !== undefined && cthuAllowance !== null && fromAmount) {
      try {
        setNeedsApproval((cthuAllowance as bigint) < parseEther(fromAmount || '0'))
      } catch { setNeedsApproval(true) }
    } else {
      setNeedsApproval(false)
    }
  }, [cthuAllowance, fromAmount, fromToken])

  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const { writeContract: swap, data: swapHash, isPending: isSwapping } = useWriteContract()
  const { isLoading: isSwapConfirming, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash: swapHash })

  useEffect(() => {
    if (isApproveSuccess) {
      addLog('Approval confirmed.')
      setNeedsApproval(false)
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isSwapSuccess) {
      addLog('Swap successful!')
      addLog(`Received: ${parseFloat(toAmount).toFixed(4)} ${toToken}`)
      setFromAmount('')
      setToAmount('')
    }
  }, [isSwapSuccess, toAmount, toToken])

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount('')
    setToAmount('')
  }

  const handleApprove = () => {
    if (!fromAmount) return
    addLog(`Approving ${fromAmount} CTHU...`)
    approve({
      address: contracts.CTHUCOIN as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contracts.ROUTER as `0x${string}`, parseEther(fromAmount)],
    })
  }

  const handleSwap = () => {
    if (!fromAmount || !toAmount || !address) return
    addLog(`Swapping ${fromAmount} ${fromToken} for ~${parseFloat(toAmount).toFixed(4)} ${toToken}...`)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
    const slippageMultiplier = BigInt(Math.floor((100 - parseFloat(slippage)) * 10))

    if (fromToken === 'MON') {
      const minOut = (parseEther(toAmount) * slippageMultiplier) / 1000n
      swap({
        address: contracts.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactMONADForTokens',
        args: [minOut, [contracts.WMONAD as `0x${string}`, contracts.CTHUCOIN as `0x${string}`], address, deadline],
        value: parseEther(fromAmount),
      })
    } else {
      const minOut = (parseEther(toAmount) * slippageMultiplier) / 1000n
      swap({
        address: contracts.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForMONAD',
        args: [parseEther(fromAmount), minOut, [contracts.CTHUCOIN as `0x${string}`, contracts.WMONAD as `0x${string}`], address, deadline],
      })
    }
  }

  const isLoading = isApproving || isApproveConfirming || isSwapping || isSwapConfirming
  const getMonBal = () => monBalance ? parseFloat(monBalance.formatted).toFixed(4) : '---'
  const getCthuBal = () => cthuBalance ? parseFloat(formatEther(cthuBalance as bigint)).toLocaleString() : '---'

  return (
    <div className="min-h-screen bg-black crt-effect">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <div className="p-6 font-mono text-base text-white flex justify-center">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left Panel - Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="text-gray-400 mb-1">CTHU-OS v0.6.6.6</div>
            <div className="text-gray-600 mb-4">{'='.repeat(40)}</div>

            <div className="mb-4">
              <Link href="/" className="text-gray-600 hover:text-teal-500">{'<'} BACK TO MAIN</Link>
            </div>

            <div className="text-teal-500 mb-4">SWAP MODULE</div>

            {/* Current Price */}
            {currentPrice > 0 && (
              <div className="text-teal-600 text-sm mb-4">
                Rate: 1 MON = {currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} CTHU
              </div>
            )}

            {/* Balances */}
            <div className="text-gray-500 mb-4 text-sm">
              <div>Your MON:  {getMonBal()}</div>
              <div>Your CTHU: {getCthuBal()}</div>
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Swap Form */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">FROM:</span>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-black border-b border-gray-700 px-2 py-1 text-white w-32 focus:border-white focus:outline-none"
                />
                <span className="text-gray-400">{fromToken}</span>
                {fromToken === 'MON' && monBalance ? (
                  <button onClick={() => setFromAmount(monBalance.formatted)} className="text-gray-600 text-xs hover:text-white">[MAX]</button>
                ) : null}
                {fromToken === 'CTHU' && cthuBalance ? (
                  <button onClick={() => setFromAmount(formatEther(cthuBalance as bigint))} className="text-gray-600 text-xs hover:text-white">[MAX]</button>
                ) : null}
              </div>

              <div className="text-gray-600 pl-16">
                <button onClick={handleSwapTokens} className="hover:text-white">↕ SWAP DIRECTION</button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">TO:</span>
                <span className="text-white w-32 px-2 py-1">
                  {toAmount ? parseFloat(toAmount).toFixed(toToken === 'MON' ? 6 : 2) : '---'}
                </span>
                <span className="text-gray-400">{toToken}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-4">{'-'.repeat(40)}</div>

            {/* Info */}
            <div className="text-gray-600 text-xs mb-4 space-y-0.5">
              <div>Slippage: {slippage}%</div>
              <div>Fee: 0.30%</div>
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <div className={`${
                  priceImpact > 5 ? 'text-red-500' :
                  priceImpact > 2 ? 'text-yellow-500' :
                  priceImpact > 0.5 ? 'text-amber-600' :
                  'text-green-600'
                }`}>
                  Price Impact: {priceImpact.toFixed(2)}%
                  {priceImpact > 5 && ' ⚠ HIGH'}
                  {priceImpact > 10 && ' SLIPPAGE!'}
                </div>
              )}
            </div>

            {/* Price Impact Warning */}
            {priceImpact > 5 && fromAmount && (
              <div className="mb-4 p-2 border border-red-900/50 bg-red-950/20 text-xs">
                <div className="text-red-500 font-bold">⚠ HIGH PRICE IMPACT WARNING</div>
                <div className="text-red-400">
                  This swap will move the price by {priceImpact.toFixed(2)}%.
                  {priceImpact > 10 && ' Consider reducing swap size.'}
                </div>
                <div className="text-gray-500 mt-1">
                  [████████{'░'.repeat(Math.max(0, 10 - Math.floor(priceImpact)))}] {Math.min(100, priceImpact * 10).toFixed(0)}% of pool
                </div>
              </div>
            )}

            {/* Action */}
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="text-yellow-500 hover:text-yellow-400">
                    {'>'} CONNECT WALLET
                  </button>
                )}
              </ConnectButton.Custom>
            ) : (
              <div className="space-y-2">
                {needsApproval ? (
                  <button
                    onClick={handleApprove}
                    disabled={isLoading || !fromAmount}
                    className="text-yellow-500 hover:text-yellow-400 disabled:text-gray-600"
                  >
                    {'>'} {isApproving || isApproveConfirming ? 'APPROVING...' : 'APPROVE CTHU'}
                  </button>
                ) : (
                  <button
                    onClick={handleSwap}
                    disabled={isLoading || !fromAmount || parseFloat(fromAmount) === 0}
                    className="text-green-500 hover:text-green-400 disabled:text-gray-600"
                  >
                    {'>'} {isSwapping || isSwapConfirming ? 'SWAPPING...' : 'EXECUTE SWAP'}
                  </button>
                )}
              </div>
            )}

            {/* Prompt */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <span className="text-gray-500">swap@cthu-os:~$</span> <BlinkingCursor />
            </div>
          </div>

          {/* Right Panel - Terminal Logs */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <TerminalLog
              title="swap.log"
              headerColor="text-teal-500"
              headerTitle="SWAP ENGINE"
              staticInfo={[
                { label: 'Router', value: `${contracts.ROUTER.slice(0, 10)}...${contracts.ROUTER.slice(-8)}` },
                { label: 'Pair', value: `${PAIR_ADDRESS.slice(0, 10)}...${PAIR_ADDRESS.slice(-8)}` },
              ]}
              logs={logs}
              statusText="Connected to Monad"
              statusColor="green"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
