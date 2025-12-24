'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { getContracts } from '@/config/contracts'
import { useChainId } from 'wagmi'

// CTHU balance thresholds for madness levels
const MADNESS_THRESHOLDS = [
  0,          // Level 0: 0 CTHU
  1_000_000,  // Level 1: 1M CTHU
  5_000_000,  // Level 2: 5M CTHU
  20_000_000, // Level 3: 20M CTHU
  50_000_000, // Level 4: 50M CTHU
  // Level 5: 50M+ CTHU
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
      return { balance: 0n, madnessLevel: 0, madnessName: 'Uninitiated' }
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

    // Cap at level 5
    if (balanceNumber >= 50_000_000) level = 5

    const names = [
      'Uninitiated',
      'Curious',
      'Touched',
      'Corrupted',
      'Possessed',
      'One with Cthulhu',
    ]

    return {
      balance,
      madnessLevel: level,
      madnessName: names[level],
    }
  }, [balanceData])

  return {
    balance,
    madnessLevel,
    madnessName,
    isConnected,
  }
}
