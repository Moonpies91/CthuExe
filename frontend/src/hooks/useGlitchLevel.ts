'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { getContracts } from '@/config/contracts'
import { useChainId } from 'wagmi'

// CTHU balance thresholds for madness levels (0-4)
const MADNESS_THRESHOLDS = [
  0,            // Level 0: Clean (0-999k)
  1_000_000,    // Level 1: Initiate (1M-4.9M)
  5_000_000,    // Level 2: Cultist (5M-19.9M)
  20_000_000,   // Level 3: High Priest (20M-49.9M)
  50_000_000,   // Level 4: Awakened (50M+)
]

// Level names per spec
const MADNESS_NAMES = [
  'Clean',
  'Initiate',
  'Cultist',
  'High Priest',
  'Awakened',
]

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export function useGlitchLevel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)

  const { data: balanceData } = useReadContract({
    address: contracts.CTHUCOIN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!contracts.CTHUCOIN,
    },
  })

  const { balance, madnessLevel, madnessName } = useMemo(() => {
    if (!balanceData) {
      return { balance: 0n, madnessLevel: 0, madnessName: 'Clean' }
    }

    const balance = balanceData as bigint
    const balanceNumber = Number(formatUnits(balance, 18))

    let level = 0
    for (let i = MADNESS_THRESHOLDS.length - 1; i >= 0; i--) {
      if (balanceNumber >= MADNESS_THRESHOLDS[i]) {
        level = i
        break
      }
    }

    // Cap at level 4 (Awakened)
    level = Math.min(level, 4)

    return {
      balance,
      madnessLevel: level,
      madnessName: MADNESS_NAMES[level],
    }
  }, [balanceData])

  return {
    balance,
    madnessLevel,
    madnessName,
    isConnected,
  }
}
