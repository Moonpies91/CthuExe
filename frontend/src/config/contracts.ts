// Contract addresses - Monad Mainnet deployment
export const CONTRACTS = {
  // Testnet addresses (Chain ID: 10143)
  testnet: {
    CTHUCOIN: process.env.NEXT_PUBLIC_CTHUCOIN_ADDRESS || '',
    FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
    ROUTER: process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '',
    FARM: process.env.NEXT_PUBLIC_FARM_ADDRESS || '',
    LAUNCHPAD: process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS || '',
    LEADERBOARD: process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS || '',
    WMONAD: process.env.NEXT_PUBLIC_WMONAD_ADDRESS || '',
  },
  // Mainnet addresses (Chain ID: 143) - Cthu.exe ecosystem V3
  mainnet: {
    CTHUCOIN: '0xb8957912629C4b69F4FDea5b804B6438385c59bd',
    FACTORY: '0x4Ff42daFE973660adaaeAbEEc43454D334e07Cf3',
    ROUTER: '0x7EBb08ea8ea3f771F3702164c7b322DC1b89eA22',
    FARM: '0x7DD345E93A6427Da795c3ca117CC5b4fa3e05849',
    LAUNCHPAD: '0x6EE3a980B976Cab95d1b7bFf7Fe37405B2f9b1E0',
    LEADERBOARD: '0x131b57851f1C8914083E40B687cf80A58c4544f9',
    WMONAD: '0x7D964A4939B45Deecd3C625E08016ACd212E99B9',
    USDT0: '0xe7cd86e13AC4309349F30B3435a9d337750fC82D',
    CTHU_MONAD_PAIR: '0x4e78020DE4428846e1731921aA678Fc1ae3E768E',
    CTHU_USDT_PAIR: '0x47d8d72CDE3e2f83d5dE8a0DD3E527d1089c6Bb7',
    MONAD_USDT_PAIR: '0x5C51057EdbcB9d8f7F3053a1E54b2c1ce6921069',
  },
}

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD'

// Get contracts for current chain
export function getContracts(chainId: number) {
  if (chainId === 10143) return CONTRACTS.testnet
  if (chainId === 143) return CONTRACTS.mainnet
  return CONTRACTS.mainnet // Default to mainnet
}
